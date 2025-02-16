function openFullscreen() {
   if (elem.requestFullscreen) {
     elem.requestFullscreen();
   } else if (elem.webkitRequestFullscreen) { /* Safari */
     elem.webkitRequestFullscreen();
   } else if (elem.msRequestFullscreen) { /* IE11 */
     elem.msRequestFullscreen();
   }
 }
 
 
 var docElm = document.documentElement;
 
 document.onkeyup = function(event) {
     if (event.keyCode === 70){
         docElm.requestFullscreen();
     }
   };
 
 