// Some actions are not included here, e.g weather as that requires a special setup depending on your installation
class panelActions { 
    static wake(){
       return '{"action":"wake"}';
    }

    static dim(value){
        return `{"action":"dim","value":"${value}"}`;
    }

    static sleep(){
        return '{"action":"sleep"}';
    }

    static date(){
        var d = new Date();
        if (d.getHours > 12)
            return `{"action":"date","data":{"date":"${d.getMonth() + "|" + d.getDay() + "|" + d.getFullYear()}","time":"${d.getHours()-12 + ":" + d.getMinutes()}"}`;
        else
            return `{"action":"date","data":{"date":"${d.getMonth() + "|" + d.getDay() + "|" + d.getFullYear()}","time":"${d.getHours() + ":" + d.getMinutes()}"}`;
    }

    static #convertState(state){
        if (state.toLowerCase()=="on"){
          return "1";
        } else {
          return "0";
        }
    }

    // Requires the use of a page object from pageHandler.js
    static force_disp(page){
        return page.toString()
    }

    static draw_string(x,y,w,h,font,pco,bco,xcen,ycen,sta,text){
        return `{"action":"draw_string","data":{"x":"${x}","y":"${y}","w":"${w}","h":"${h}","font":"${font}","pco":"${pco}","bco":"${bco}","xcen":"${xcen}","ycen":"${ycen}","sta":"${sta}","text":"${text}"}}`;
    }

    static draw_pic(x,y,pic){
        return `{"action":"draw_pic","data":{"x":"${x}","y":"${y}","pic":"${pic}"}}`
    }

    static draw_cls(color){ // Takes 565 color
        return `{"action":"draw_cls","data":{"color":"${color}"}}`;
    }

    static draw_fullrec(x,y,w,h,color){
        return `{"action":"draw_fullrec","data":{"x":"${x}","y":"${y}","w":"${w}","h":"${h}","color":"${color}"}}`
    }

    static draw_line(x,y,x2,y2,color){
        return `{"action":"draw_line","data":{"x":"${x}","y":"${y}","x2":"${x2}","y2":"${y2}","color":"${color}"}}`
    }

    static draw_hollowrec(x,y,x2,y2,color){
        return `{"action":"draw_hollowrec","data":{"x":"${x}","y":"${y}","x2":"${x2}","y2":"${y2}","color":"${color}"}}`
    }

    static draw_hollowcir(x,y,r,color){
        return `{"action":"draw_hollowcir","data":{"x":"${x}","y":"${y}","r":"${r}","color":"${color}"}}`
    }

    static draw_fullcir(x,y,r,color){
        return `{"action":"draw_fullcir","data":{"x":"${x}","y":"${y}","r":"${r}","color":"${color}"}}`
    }

    static vis(id,state){
        return `{"action":"vis","data":{"id":"${id}","state":"${state}"}}`
    }

}

exports.panelActions = panelActions;