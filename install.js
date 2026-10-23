// "Get the app" card for phone browsers. Shown on the title screen every visit
// (closing it only hides it until the next visit), never once the game runs as
// the installed home-screen app. Android/Chrome gets a real INSTALL button via
// beforeinstallprompt; iPhone/iPad (and browsers without that event) get
// Add to Home Screen steps instead. CSS only shows it on touch devices on the
// title screen (body.pad.title, set by game.js).
(function(){
  var box=document.getElementById('install'), btn=document.getElementById('installBtn'),
      how=document.getElementById('installHow'), x=document.getElementById('installX');
  function installed(){
    return navigator.standalone===true||
      (window.matchMedia&&(matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches));
  }
  if(installed())return;
  var ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var prompt=null;
  how.innerHTML=ios?'Tap <b>Share</b> <span class="share"></span> then <b>Add to Home Screen</b>'
                   :'Open the browser menu <b>&#8942;</b> then <b>Install app</b> or <b>Add to Home screen</b>';
  box.classList.add('on');
  window.addEventListener('beforeinstallprompt',function(e){
    e.preventDefault(); prompt=e;
    box.classList.add('native');
  });
  function stop(e){ e.stopPropagation(); }
  box.addEventListener('pointerdown',stop); box.addEventListener('touchstart',stop,{passive:true});
  btn.addEventListener('click',function(){
    if(!prompt)return;
    var p=prompt; prompt=null; box.classList.remove('native');
    p.prompt();
    if(p.userChoice)p.userChoice.then(function(c){ if(c.outcome==='accepted')box.classList.remove('on'); },function(){});
  });
  x.addEventListener('click',function(){ box.classList.remove('on'); });
  window.addEventListener('appinstalled',function(){ box.classList.remove('on'); });
})();
