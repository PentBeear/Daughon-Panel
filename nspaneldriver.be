# Sonoff NSPanel Tasmota Lovelace UI Berry Driver | code by PentBeear
# based on;
# Sonoff NSPanel Tasmota Lovelace UI Berry Driver | code by joBr99
# based on;
# Sonoff NSPanel Tasmota (Nextion with Flashing) driver | code by peepshow-21
# based on;
# Sonoff NSPanel Tasmota driver v0.47 | code by blakadder and s-hadinger
# What a large chain of people using each others code :)

# Example Flash
# FlashNextion http://172.17.20.5:8080/static/chunks/nxpanel.tft
# FlashNextion http://proto.systems/nxpanel/nxpanel-1.0.0.tft

class Nextion : Driver

    static VERSION = "1.1.4"
    static header = bytes().fromstring("PS")

    static flash_block_size = 4096

    var updates
    var flash_mode
    var flash_size
    var flash_written
    var flash_buff
    var flash_offset
    var awaiting_offset
    var flash_time
    var tcp
    var ser
    var last_per
    var auto_update_flag
    var url

    def split_msg(b) # Splits at 0x55
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

    def crc16(data, poly) # just a hash
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

    def encode(payload) # Adds header so panel can know what to expect of course
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
        #log(string.format("NSP: Nextion command sent = %s",str(payload_bin)))       
    end

    def send(payload)
        var payload_bin = self.encode(payload)
        if self.flash_mode==1
            log("NSP: skipped command because still flashing", 3)
        else 
            self.ser.write(payload_bin)
            log("NSP: payload sent = " + str(payload_bin), 3)
        end
    end

    def screeninit()
        log("NSP: Screen Initialized", 1) 
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
            self.ser.write(to_write)
        end
        log("FLH: Total "+str(self.flash_written),3)
        if (self.flash_written==self.flash_size)
            log("FLH: Flashing complete - Time elapsed: %d", (tasmota.millis()-self.flash_time)/1000)
            self.ser = nil
            self.flash_mode = 0
            tasmota.gc()
			self.ser = serial(17, 16, 115200, serial.SERIAL_8N1)
            self.updates=true
            tasmota.set_timer(40000,/->self.set_weather()) 
        end
    end

    def every_100ms()
        import string
        if self.ser.available() > 0
            var msg = self.ser.read()
            if size(msg) > 0
                log(string.format("NSP: Received Raw = %s",str(msg)), 3)
                if (self.flash_mode==1)
                    var strv = msg[0..-4].asstring()
                    if string.find(strv,"comok 2")>=0 # Screen responds that its ready to receive inital flash setup
                        log("FLH: (1.2 Protocol) Flashing Begin")
                        self.flash_time = tasmota.millis()
                        self.sendnx(string.format("whmi-wris %d,921600,res0",self.flash_size))
                        self.ser = serial(17, 16, 921600, serial.SERIAL_8N1) # Sets faster serial speed from default 115200 so it doesn't take an hour
                    elif size(msg)==1 && msg[0]==0x08 # Prepare to receive an offset value
                        log("FLH: Screen requested offset...")
                        self.awaiting_offset = 1
                    elif size(msg)==4 && self.awaiting_offset==1 # A new offset value has been given
                        self.awaiting_offset = 0
                        self.flash_offset = msg.get(0,4)
                        
                        if self.flash_offset != 0
							self.open_url(self.url, self.flash_offset)
							self.flash_written = self.flash_offset
						end
                        log("FLH: New flash offset marker "+str(self.flash_offset))
                        self.write_block()
                    elif size(msg)==1 && msg[0]==0x05 # Next Block
                        self.write_block()
                    else
                        log("FLH: Something has gone wrong flashing firmware ["+str(msg)+"]")
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

    def begin_nextion_flash() # Sends connect command so it actually cares
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
        if(self.updates==true) # Checks if updates should be disabled like for flashing
            import json
            var weather_icon = {
            "": "",      # Unknown             
            "113": "",    # Sunny      
            "116": "",    # PartlyCloudy   
            "119": "",    # Cloudy             
            "122": "",   # VeryCloudy           
            "143": "",   # Fog                 
            "176": "",   # LightShowers     
            "179": "",   # LightSleetShowers 
            "182": "",   # LightSleet        
            "185": "",   # LightSleet        
            "200": "",   # ThunderyShowers  
            "227": "",   # LightSnow  
            "230": "",   # HeavySnow        
            "248": "",   # Fog                 
            "260": "",   # Fog                 
            "263": "",   # LightShowers     
            "266": "",   # LightRain      
            "281": '',   # LightSleet        
            "284": "",   # LightSleet        
            "293": "",   # LightRain      
            "296": "",   # LightRain      
            "299": "",   # HeavyShowers      
            "302": "",   # HeavyRain        
            "305": "",   # HeavyShowers      
            "308": "",   # HeavyRain        
            "311": "",   # LightSleet        
            "314": "",   # LightSleet        
            "317": "",   # LightSleet        
            "320": "",   # LightSnow  
            "323": "",   # LightSnowShowers 
            "326": "",   # LightSnowShowers 
            "329": "",   # HeavySnow        
            "332": "",   # HeavySnow        
            "335": "",   # HeavySnowShowers   
            "338": "",   # HeavySnow        
            "350": "",   # LightSleet        
            "353": "",   # LightSleet        
            "356": "",   # HeavyShowers      
            "359": "",   # HeavyRain        
            "362": "",   # LightSleetShowers 
            "365": "",   # LightSleetShowers 
            "368": "",   # LightSnowShowers 
            "371": "",   # HeavySnowShowers   
            "374": "",   # LightSleetShowers 
            "377": "",   # LightSleet        
            "386": "",   # ThunderyShowers  
            "389": "",   # ThunderyHeavyRain  
            "392": "",   # ThunderySnowShowers
            "395": "",   # HeavySnowShowers   
            }   
            var cl = webclient()
            var url = "http://wttr.in/" + "36.3048,-86.6200" + '?format=j2' # Placeholder of nashville change to where you want
            cl.set_useragent("curl/7.72.0")      
            cl.begin(url)
            if cl.GET() == "200" || cl.GET() == 200
                var b = json.load(cl.get_string())
                var temp = b['current_condition'][0]['temp_F']
                var tmin = b['weather'][0]['mintempF']
                var tmax = b['weather'][0]['maxtempF']
                var wttr = '{"action":"weather","data":{"icon":"' + str(weather_icon[b['current_condition'][0]['weatherCode']]) + '","temp":"' + temp + 'F' + '"}}'
                # {"action":"weather","data":{"icon":"hello","temp":"50"}}
                #var wttr = '{"HMI_weather":' + str(weather_icon[b['current_condition'][0]['weatherCode']]) + ',"HMI_outdoorTemp":{"current":' + temp + ',"range":" ' + tmin + ', ' + tmax + '"}}'
                self.sendnx(wttr)
                log('NSP: Weather update for location: ' + b['nearest_area'][0]['areaName'][0]['value'] + ", "+ b['nearest_area'][0]['country'][0]['value'])
                #print('NSP: Weather update for location: ' + b['nearest_area'][0]['areaName'][0]['value'] + ", "+ b['nearest_area'][0]['country'][0]['value'] + " " + wttr)
            else
                log('NSP: Weather update failed!', 3)     
                print("Failed") 
            end
        end
    end

    # It updates clock and date for 10 cycles then it updates the clock the date and then the weather and repeats
    def set_date()
        if(self.updates==true) # Checks if updates should be disabled like for flashing
            var now = tasmota.rtc()
            var time_raw = now['local']
            var nsp_time = tasmota.time_dump(time_raw)  
            # {"action":"date","data":{"date":"02|28|2022","time":"50:20"}}
            if nsp_time['min'] <= 9 # Adds a 0 to pad the time if the minute is less than 9
                if nsp_time['hour'] > 12 # Converts to 12 hour time formatting instead of 24
                    var date_payload = '{"action":"date","data":' + '{"date":"' + str(nsp_time['month']) + "|" + str(nsp_time['day']) + "|" + str(nsp_time['year']) + '",' + '"time":"' + str(nsp_time['hour'] - 12) + ":0" + str(nsp_time['min']) + '"}}'
                    self.sendnx(date_payload)
                    log('NSP: Time update for NSP ' + date_payload)
                else
                    var date_payload = '{"action":"date","data":' + '{"date":"' + str(nsp_time['month']) + "|" + str(nsp_time['day']) + "|" + str(nsp_time['year']) + '",' + '"time":"' + str(nsp_time['hour']) + ":0" + str(nsp_time['min']) + '"}}'
                    self.sendnx(date_payload)
                    log('NSP: Time update for NSP ' + date_payload)
                end
            else 
                if nsp_time['hour'] > 12
                    var date_payload = '{"action":"date","data":' + '{"date":"' + str(nsp_time['month']) + "|" + str(nsp_time['day']) + "|" + str(nsp_time['year']) + '",' + '"time":"' + str(nsp_time['hour'] - 12) + ":" + str(nsp_time['min']) + '"}}'
                    self.sendnx(date_payload)
                    log('NSP: Time update for NSP ' + date_payload)
                else
                    var date_payload = '{"action":"date","data":' + '{"date":"' + str(nsp_time['month']) + "|" + str(nsp_time['day']) + "|" + str(nsp_time['year']) + '",' + '"time":"' + str(nsp_time['hour']) + ":" + str(nsp_time['min']) + '"}}'
                    self.sendnx(date_payload)
                    log('NSP: Time update for NSP ' + date_payload)
                end
                
            end    

            if nsp_time['min'] % 10 == 0 # Every 10 minutes update the weather
                tasmota.set_timer(20000,/->self.set_weather()) 
            end
        end
    end

    def open_url(url, offset)
        import string
        var host
        self.url=url
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
        var get_req = "GET "+get+" HTTP/1.0\r\n"
		get_req += string.format("Range: bytes=%d-\r\n", offset)
		get_req += string.format("HOST: %s:%s\r\n\r\n",host,port)
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
        print(headers)
        # check http respose for code 200/206
        if string.find(headers,"200 OK")>0 || string.find(headers,"206 Partial Content")>0
            log("FLH: HTTP Respose is 200 OK or 206 Partial Content",3)
		else
            log("FLH: HTTP Respose is not 200 OK or 206 Partial Content",3)
			print(headers)
			return -1
        end
        if(offset==0) # Only set flash size if there is no offset
            var tag = "Content-Length: "
            i = string.find(headers,tag)
            if (i>0) 
                var i2 = string.find(headers,"\r\n",i)
                var s = headers[i+size(tag)..i2-1]
                self.flash_size=int(s)
            end
            log("FLH: Flash file size: "+str(self.flash_size),3)
        end
       
    end

    def flash_nextion(url)
        self.updates=false
        self.flash_size = 0
        self.open_url(url,0)
        self.begin_nextion_flash()
    end

    def init() 
        log("NSP: Initializing Driver")
        self.ser = serial(17, 16, 115200, serial.SERIAL_8N1)
        self.sendnx('DRAKJHSUYDGBNCJHGJKSHBDN')
        self.sendnx('rest')
        self.flash_mode = 0
        tasmota.set_timer(20000,/->tasmota.publish_result('{"status":"init"}', "RESULT")) 
        log("NSP: Sent Init")
        self.updates=true
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

def send_cmd(cmd, idx, payload, payload_json) # Sends command via serial with nextion end of FFFFFF used for protocol reparse
    nextion.sendnx(payload)
    tasmota.resp_cmnd_done()
end

tasmota.add_cmd('Nextion', send_cmd)
tasmota.add_cmd('FlashNextion', flash_nextion)
tasmota.add_rule("Time#Minute", /-> nextion.set_date())
tasmota.set_timer(20000,/->nextion.set_date()) 
tasmota.set_timer(40000,/->nextion.set_weather()) 
tasmota.cmd("Rule3 1") # needed until Berry bug fixed
tasmota.cmd("State")
