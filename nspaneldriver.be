# Sonoff NSPanel Tasmota (Nextion with Flashing) driver | code by peepshow-21
# based on;
# Sonoff NSPanel Tasmota driver v0.47 | code by blakadder and s-hadinger

# Example Flash
# FlashNextion http://172.17.20.5:8080/static/chunks/nxpanel.tft
# FlashNextion http://proto.systems/nxpanel/nxpanel-1.0.0.tft

class Nextion : Driver

    static VERSION = "1.1.3"
    static header = bytes().fromstring("PS")

    static flash_block_size = 4096

    var flash_mode
    var flash_size
    var flash_written
    var flash_buff
    var flash_offset
    var awaiting_offset
    var tcp
    var ser
    var last_per
    var auto_update_flag

    def split_msg(b)   
        import string
        var ret = []
        var i = 0
        while i < size(b)-1
            if b[i] == 0x55 && b[i+1] == 0xAA
                if i > 0
                    var nb = b[0..i-1];
                    ret.push(nb)
                end
                b = b[i+2..]
                i = 0
            else
                i+=1
            end
        end
        if size(b) > 0
            ret.push(b)
        end
        return ret
    end

    def crc16(data, poly)
      if !poly  poly = 0xA001 end
      # CRC-16 MODBUS HASHING ALGORITHM
      var crc = 0xFFFF
      for i:0..size(data)-1
        crc = crc ^ data[i]
        for j:0..7
          if crc & 1
            crc = (crc >> 1) ^ poly
          else
            crc = crc >> 1
          end
        end
      end
      return crc
    end

    def encode(payload)
      var b = bytes()
      b += self.header
      var nsp_type = 0 # not used
      b.add(nsp_type)       # add a single byte
      var b1 = bytes().fromstring(payload)
      var b2 = bytes()
      for i: 0..size(b1)-1
        if (b1[i]!=0xC2)
            b2.add(b1[i])
        end
      end
      b.add(size(b2), 2)   # add size as 2 bytes, little endian
      b += b2
      var msg_crc = self.crc16(b)
      b.add(msg_crc, 2)       # crc 2 bytes, little endian
      return b
    end

    def encodenx(payload)
        var b = bytes().fromstring(payload)
        b += bytes('FFFFFF')
        return b
    end

    def sendnx(payload)
        import string
        var payload_bin = self.encodenx(payload)
        self.ser.write(payload_bin)
        log(string.format("NXP: Nextion command sent = %s",str(payload_bin)))       
    end

    def send(payload)
        var payload_bin = self.encode(payload)
        if self.flash_mode==1
            log("NXP: skipped command becuase still flashing", 3)
        else 
            self.ser.write(payload_bin)
            log("NXP: payload sent = " + str(payload_bin), 3)
        end
    end

    def screeninit()
        log("NXP: Screen Initialized", 1) 
        self.sendnx("berry.txt=\""+self.VERSION+"\"")
        self.sendnx("recmod=1")
    end

    def write_block()
        import string
        log("FLH: Read block",3)
        while size(self.flash_buff)<self.flash_block_size && self.tcp.connected()
            if self.tcp.available()>0
                self.flash_buff += self.tcp.readbytes()
            else
                tasmota.delay(50)
                log("FLH: Wait for available...",3)
            end
        end
        log("FLH: Buff size "+str(size(self.flash_buff)),3)
        var to_write
        if size(self.flash_buff)>self.flash_block_size
            to_write = self.flash_buff[0..self.flash_block_size-1]
            self.flash_buff = self.flash_buff[self.flash_block_size..]
        else
            to_write = self.flash_buff
            self.flash_buff = bytes()
        end
        log("FLH: Writing "+str(size(to_write)),3)
        var per = (self.flash_written*100)/self.flash_size
        if (self.last_per!=per) 
            self.last_per = per
            tasmota.publish_result(string.format("{\"Flashing\":{\"complete\": %d}}",per), "RESULT") 
        end
        if size(to_write)>0
            self.flash_written += size(to_write)
            if self.flash_offset==0 || self.flash_written>self.flash_offset
                self.ser.write(to_write)
                self.flash_offset = 0
            else
                tasmota.set_timer(10,/->self.write_block())
            end
        end
        log("FLH: Total "+str(self.flash_written),3)
        if (self.flash_written==self.flash_size)
            log("FLH: Flashing complete")
            self.flash_mode = 0
        end

    end

    def every_50ms()
        import string
        if self.ser.available() > 0
            var msg = self.ser.read()
            if size(msg) > 0
                log(string.format("NXP: Received Raw = %s",str(msg)), 3)
                if (self.flash_mode==1)
                    var strv = msg[0..-4].asstring()
                    if string.find(strv,"comok 2")>=0
                        log("FLH: Send (High Speed) flash start")
                        self.sendnx(string.format("whmi-wris %d,115200,res0",self.flash_size))
                    elif size(msg)==1 && msg[0]==0x08
                        log("FLH: Waiting offset...",3)
                        self.awaiting_offset = 1
                    elif size(msg)==4 && self.awaiting_offset==1
                        self.awaiting_offset = 0
                        self.flash_offset = msg.get(0,4)
                        log("FLH: Flash offset marker "+str(self.flash_offset),3)
                        self.write_block()
                    elif size(msg)==1 && msg[0]==0x05
                        self.write_block()
                    else
                        log("FLH: Something has gone wrong flashing firmware ["+str(msg)+"]",2)
                    end
                else
                    var msg_list = self.split_msg(msg)
                    for i:0..size(msg_list)-1
                        msg = msg_list[i]
                        if size(msg) > 0    
                            var jm = string.format("%s",msg[0..-1].asstring()) # Prints result as a string
                            tasmota.publish_result(jm, "RESULT")        
                        end       
                    end
                end
            end
        end
    end      

    def begin_nextion_flash()
        self.flash_written = 0
        self.awaiting_offset = 0
        self.flash_offset = 0
        self.sendnx('DRAKJHSUYDGBNCJHGJKSHBDN')
        self.sendnx('recmod=0')
        self.sendnx('recmod=0')
        self.flash_mode = 1
        self.sendnx("connect")        
    end

    # sunny 0 (7)
    # partlycloudy 1 (5)
    # cloudy 2 (8)
    # really cloudly 3 (2)
    # light rain 4 (4)
    # heavy rain 5 (3)
    # snow 6 (6)
    # unknown 7 (9)

    def set_weather()
        import json
        var weather_icon = {
        "": 7,      # Unknown             
        "113": 0,    # Sunny      
        "116": 1,    # PartlyCloudy   
        "119": 2,    # Cloudy             
        "122": 3,   # VeryCloudy           
        "143": 2,   # Fog                 
        "176": 4,   # LightShowers     
        "179": 4,   # LightSleetShowers 
        "182": 4,   # LightSleet        
        "185": 4,   # LightSleet        
        "200": 4,   # ThunderyShowers  
        "227": 6,   # LightSnow  
        "230": 6,   # HeavySnow        
        "248": 2,   # Fog                 
        "260": 2,   # Fog                 
        "263": 4,   # LightShowers     
        "266": 4,   # LightRain      
        "281": 4,   # LightSleet        
        "284": 4,   # LightSleet        
        "293": 4,   # LightRain      
        "296": 4,   # LightRain      
        "299": 5,   # HeavyShowers      
        "302": 5,   # HeavyRain        
        "305": 5,   # HeavyShowers      
        "308": 5,   # HeavyRain        
        "311": 4,   # LightSleet        
        "314": 4,   # LightSleet        
        "317": 4,   # LightSleet        
        "320": 6,   # LightSnow  
        "323": 6,   # LightSnowShowers 
        "326": 6,   # LightSnowShowers 
        "329": 6,   # HeavySnow        
        "332": 6,   # HeavySnow        
        "335": 6,   # HeavySnowShowers   
        "338": 6,   # HeavySnow        
        "350": 4,   # LightSleet        
        "353": 4,   # LightSleet        
        "356": 5,   # HeavyShowers      
        "359": 5,   # HeavyRain        
        "362": 4,   # LightSleetShowers 
        "365": 4,   # LightSleetShowers 
        "368": 4,   # LightSnowShowers 
        "371": 6,   # HeavySnowShowers   
        "374": 4,   # LightSleetShowers 
        "377": 4,   # LightSleet        
        "386": 4,   # ThunderyShowers  
        "389": 5,   # ThunderyHeavyRain  
        "392": 6,   # ThunderySnowShowers
        "395": 6,   # HeavySnowShowers   
        }   
        var cl = webclient()
        var url = "http://wttr.in/" + "putlocal" + '?format=j2'
        cl.set_useragent("curl/7.72.0")      
        cl.begin(url)
        if cl.GET() == "200" || cl.GET() == 200
            var b = json.load(cl.get_string())
            var temp = b['current_condition'][0]['temp_F']
            var tmin = b['weather'][0]['mintempF']
            var tmax = b['weather'][0]['maxtempF']
            var wttr = '{"weather":"' + temp + '","' + str(weather_icon[b['current_condition'][0]['weatherCode']]) + '"}'
            #var wttr = '{"HMI_weather":' + str(weather_icon[b['current_condition'][0]['weatherCode']]) + ',"HMI_outdoorTemp":{"current":' + temp + ',"range":" ' + tmin + ', ' + tmax + '"}}'
            self.sendnx(wttr)
            log('NSP: Weather update for location: ' + b['nearest_area'][0]['areaName'][0]['value'] + ", "+ b['nearest_area'][0]['country'][0]['value'])
            #print('NSP: Weather update for location: ' + b['nearest_area'][0]['areaName'][0]['value'] + ", "+ b['nearest_area'][0]['country'][0]['value'] + " " + wttr)
            else
            log('NSP: Weather update failed!', 3)     
            print("Failed") 
        end
    end

    # It updates clock and date for 10 cycles then it updates the clock the date and then the weather and repeats
    def set_date()
        var now = tasmota.rtc()
        var time_raw = now['local']
        var nsp_time = tasmota.time_dump(time_raw)  

        if nsp_time['min'] <= 9
            var date_payload = '{"date":"' + str(nsp_time['month']) + "|" + str(nsp_time['day']) + "|" + str(nsp_time['year']) + '",' + '"time":"' + str(nsp_time['hour']) + ":0" + str(nsp_time['min']) + '"}'
            self.sendnx(date_payload)
            log('NSP: Time update for NSP ' + date_payload)
          else 
            var date_payload = '{"date":"' + str(nsp_time['month']) + "|" + str(nsp_time['day']) + "|" + str(nsp_time['year']) + '",' + '"time":"' + str(nsp_time['hour']) + ":" + str(nsp_time['min']) + '"}'
            self.sendnx(date_payload)
            log('NSP: Time update for NSP ' + date_payload)
        end    

        if nsp_time['min'] % 10 == 0 # Every 10 minutes update the weather
            tasmota.set_timer(20000,/->self.set_weather()) 
        end

    end

    def open_url(url)
        import string
        var host
        var port
        var s1 = string.split(url,7)[1]
        var i = string.find(s1,":")
        var sa
        if i<0
            port = 80
            i = string.find(s1,"/")
            sa = string.split(s1,i)
            host = sa[0]
        else
            sa = string.split(s1,i)
            host = sa[0]
            s1 = string.split(sa[1],1)[1]
            i = string.find(s1,"/")
            sa = string.split(s1,i)
            port = int(sa[0])
        end
        var get = sa[1]
        log(string.format("FLH: host: %s, port: %s, get: %s",host,port,get))
        self.tcp = tcpclient()
        self.tcp.connect(host,port)
        log("FLH: Connected:"+str(self.tcp.connected()),3)
        var get_req = "GET "+url+" HTTP/1.0\r\n\r\n"
        self.tcp.write(get_req)
        var a = self.tcp.available()
        i = 1
        while a==0 && i<5
          tasmota.delay(100*i)
          tasmota.yield() 
          i += 1
          log("FLH: Retry "+str(i),3)
          a = self.tcp.available()
        end
        if a==0
            log("FLH: Nothing available to read!",3)
            return
        end
        var b = self.tcp.readbytes()
        i = 0
        var end_headers = false;
        var headers
        while i<size(b) && headers==nil
            if b[i..(i+3)]==bytes().fromstring("\r\n\r\n") 
                headers = b[0..(i+3)].asstring()
                self.flash_buff = b[(i+4)..]
            else
                i += 1
            end
        end
        #print(headers)
        var tag = "Content-Length: "
        i = string.find(headers,tag)
        if (i>0) 
            var i2 = string.find(headers,"\r\n",i)
            var s = headers[i+size(tag)..i2-1]
            self.flash_size=int(s)
        end
        if self.flash_size==0
            log("FLH: No size header, counting ...",3)
            self.flash_size = size(self.flash_buff)
            #print("counting start ...")
            while self.tcp.connected()
                while self.tcp.available()>0
                    self.flash_size += size(self.tcp.readbytes())
                end
                tasmota.delay(50)
            end
            #print("counting end ...",self.flash_size)
            self.tcp.close()
            self.open_url(url)
        else
            log("FLH: Size found in header, skip count",3)
        end
        log("FLH: Flash file size: "+str(self.flash_size),3)

    end

    def flash_nextion(url)
        self.flash_size = 0
        self.open_url(url)
        self.begin_nextion_flash()
    end

    def init() 
        log("NXP: Initializing Driver")
        self.ser = serial(17, 16, 115200, serial.SERIAL_8N1)
        self.sendnx('DRAKJHSUYDGBNCJHGJKSHBDN')
        self.sendnx('rest')
        self.flash_mode = 0
        tasmota.set_timer(20000,/->tasmota.publish_result('{"status":"init"}', "RESULT")) 
        log("NXP: Sent Init")
    end

end

var nextion = Nextion()

tasmota.add_driver(nextion)

def flash_nextion(cmd, idx, payload, payload_json)
    def task()
        nextion.flash_nextion(payload)
    end
    tasmota.set_timer(0,task)
    tasmota.resp_cmnd_done()
end

def send_cmd(cmd, idx, payload, payload_json) # Sends command via serial with nextion end of FFFFFF
    nextion.sendnx(payload)
end

tasmota.add_cmd('Nextion', send_cmd)
tasmota.add_cmd('FlashNextion', flash_nextion)
tasmota.add_rule("Time#Minute", /-> nextion.set_date())
tasmota.set_timer(20000,/->nextion.set_date()) 
tasmota.set_timer(40000,/->nextion.set_weather()) 
tasmota.cmd("Rule3 1") # needed until Berry bug fixed
tasmota.cmd("State")
