let pts = parseInt(localStorage.getItem('pts')) || 0;
let unlockedLevel = parseInt(localStorage.getItem('unlockedLevel')) || 1;
let isKids = true;
let recognition = null;
let isListening = false;

// --- SONIDOS ---
const sfx = {
    correct: new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg'),
    wrong: new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg'),
    win: new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg')
};
function playSfx(t) { if(sfx[t]) { sfx[t].currentTime=0; sfx[t].play().catch(e=>{}); } }

// --- BASE DE DATOS ---
const phonetics = {'A':'Ei','B':'Bi','C':'Ci','D':'Di','E':'Ii','F':'Ef','G':'Yi','H':'Eich','I':'Ai','J':'Yei','K':'Kei','L':'El','M':'Em','N':'En','O':'Ou','P':'Pi','Q':'Kiu','R':'Ar','S':'Es','T':'Ti','U':'Yu','V':'Vi','W':'Dabliu','X':'Ex','Y':'Uai','Z':'Zi'};
const abcList = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').map(l => ({i:l, e:phonetics[l], s:l, sound: phonetics[l]}));

const db = {
    greetings: [{i:'👋',e:'Hello',s:'Hola'},{i:'🚶',e:'Bye',s:'Adiós'},{i:'🌅',e:'Good Morning',s:'Buenos días'},{i:'🌇',e:'Good Afternoon',s:'Buenas tardes'},{i:'🌙',e:'Good Night',s:'Buenas noches'},{i:'🙏',e:'Thank you',s:'Gracias'},{i:'😊',e:'Please',s:'Por favor'},{i:'❓',e:'How are you?',s:'¿Cómo estás?'}],
    abc: abcList,
    verbs: [{i:'🏃',e:'Run',s:'Correr'},{i:'🚶',e:'Walk',s:'Caminar'},{i:'🤸',e:'Jump',s:'Saltar'},{i:'🏊',e:'Swim',s:'Nadar'},{i:'💃',e:'Dance',s:'Bailar'},{i:'🎤',e:'Sing',s:'Cantar'},{i:'📖',e:'Read',s:'Leer'},{i:'✍️',e:'Write',s:'Escribir'},{i:'🎨',e:'Paint',s:'Pintar'},{i:'🍳',e:'Cook',s:'Cocinar'},{i:'🧹',e:'Clean',s:'Limpiar'},{i:'🛌',e:'Sleep',s:'Dormir'},{i:'🍽️',e:'Eat',s:'Comer'},{i:'🥤',e:'Drink',s:'Beber'},{i:'👂',e:'Listen',s:'Escuchar'}],
    animals: [{i:'🐶',e:'Dog',s:'Perro'},{i:'🐱',e:'Cat',s:'Gato'},{i:'🦁',e:'Lion',s:'León'},{i:'🐯',e:'Tiger',s:'Tigre'},{i:'🐘',e:'Elephant',s:'Elefante'},{i:'🐵',e:'Monkey',s:'Mono'},{i:'🦒',e:'Giraffe',s:'Jirafa'},{i:'🦓',e:'Zebra',s:'Cebra'},{i:'🐻',e:'Bear',s:'Oso'},{i:'🐰',e:'Rabbit',s:'Conejo'},{i:'🐴',e:'Horse',s:'Caballo'},{i:'🐮',e:'Cow',s:'Vaca'},{i:'🐷',e:'Pig',s:'Cerdo'},{i:'🐸',e:'Frog',s:'Rana'},{i:'🦆',e:'Duck',s:'Pato'}],
    fruits: [{i:'🍎',e:'Apple',s:'Manzana'},{i:'🍌',e:'Banana',s:'Plátano'},{i:'🍇',e:'Grapes',s:'Uvas'},{i:'🍊',e:'Orange',s:'Naranja'},{i:'🍓',e:'Strawberry',s:'Fresa'},{i:'🍉',e:'Watermelon',s:'Sandía'},{i:'🍍',e:'Pineapple',s:'Piña'},{i:'🍐',e:'Pear',s:'Pera'},{i:'🥥',e:'Coconut',s:'Coco'},{i:'🥝',e:'Kiwi',s:'Kiwi'},{i:'🍋',e:'Lemon',s:'Limón'}],
    food: [{i:'🍕',e:'Pizza',s:'Pizza'},{i:'🍔',e:'Burger',s:'Hamburguesa'},{i:'🌭',e:'Hot Dog',s:'Perro Caliente'},{i:'🍟',e:'Fries',s:'Papas Fritas'},{i:'🍞',e:'Bread',s:'Pan'},{i:'🧀',e:'Cheese',s:'Queso'},{i:'🍗',e:'Chicken',s:'Pollo'},{i:'🥣',e:'Soup',s:'Sopa'},{i:'🍚',e:'Rice',s:'Arroz'},{i:'🥗',e:'Salad',s:'Ensalada'},{i:'🥚',e:'Egg',s:'Huevo'},{i:'🥛',e:'Milk',s:'Leche'},{i:'🍪',e:'Cookie',s:'Galleta'},{i:'🍦',e:'Ice Cream',s:'Helado'},{i:'🍰',e:'Cake',s:'Pastel'}],
    colors: [{i:'🔴',e:'Red',s:'Rojo'},{i:'🔵',e:'Blue',s:'Azul'},{i:'🟢',e:'Green',s:'Verde'},{i:'🟡',e:'Yellow',s:'Amarillo'},{i:'🟠',e:'Orange',s:'Naranja'},{i:'🟣',e:'Purple',s:'Morado'},{i:'👚',e:'Pink',s:'Rosa'},{i:'⚫',e:'Black',s:'Negro'},{i:'⚪',e:'White',s:'Blanco'},{i:'🟤',e:'Brown',s:'Café'}],
    routines: [{i:'🥱',e:'Wake up',s:'Despertar'},{i:'🚿',e:'Shower',s:'Ducha'},{i:'🦷',e:'Brush teeth',s:'Cepillar'},{i:'👗',e:'Dress',s:'Vestir'},{i:'🥣',e:'Breakfast',s:'Desayuno'},{i:'🏫',e:'School',s:'Escuela'},{i:'⚽',e:'Play',s:'Jugar'},{i:'🛌',e:'Sleep',s:'Dormir'}],
    family: [{i:'👨',e:'Father',s:'Papá'},{i:'👩',e:'Mother',s:'Mamá'},{i:'👦',e:'Brother',s:'Hermano'},{i:'👧',e:'Sister',s:'Hermana'},{i:'👴',e:'Grandpa',s:'Abuelo'},{i:'👵',e:'Grandma',s:'Abuela'},{i:'👶',e:'Baby',s:'Bebé'},{i:'👪',e:'Family',s:'Familia'},{i:'🧔',e:'Uncle',s:'Tío'},{i:'👱‍♀️',e:'Aunt',s:'Tía'},{i:'🧒',e:'Cousin',s:'Primo/a'}],
    numbers: [{i:'1️⃣',e:'One',s:'1'},{i:'2️⃣',e:'Two',s:'2'},{i:'3️⃣',e:'Three',s:'3'},{i:'4️⃣',e:'Four',s:'4'},{i:'5️⃣',e:'Five',s:'5'},{i:'6️⃣',e:'Six',s:'6'},{i:'7️⃣',e:'Seven',s:'7'},{i:'8️⃣',e:'Eight',s:'8'},{i:'9️⃣',e:'Nine',s:'9'},{i:'🔟',e:'Ten',s:'10'}],
    home: [{i:'🏠',e:'House',s:'Casa'},{i:'🚪',e:'Door',s:'Puerta'},{i:'🪟',e:'Window',s:'Ventana'},{i:'🛋️',e:'Sofa',s:'Sofá'},{i:'🛏️',e:'Bed',s:'Cama'},{i:'🚽',e:'Toilet',s:'Baño'},{i:'🛁',e:'Bath',s:'Bañera'},{i:'💡',e:'Lamp',s:'Lámpara'}],
    body: [{i:'👤',e:'Head',s:'Cabeza'},{i:'👁️',e:'Eye',s:'Ojo'},{i:'👃',e:'Nose',s:'Nariz'},{i:'👄',e:'Mouth',s:'Boca'},{i:'👂',e:'Ear',s:'Oreja'},{i:'💪',e:'Arm',s:'Brazo'},{i:'✋',e:'Hand',s:'Mano'},{i:'🦵',e:'Leg',s:'Pierna'},{i:'🦶',e:'Foot',s:'Pie'},{i:'🦷',e:'Teeth',s:'Dientes'}],
    school: [{i:'✏️',e:'Pencil',s:'Lápiz'},{i:'🖊️',e:'Pen',s:'Bolígrafo'},{i:'📏',e:'Ruler',s:'Regla'},{i:'🎒',e:'Backpack',s:'Mochila'},{i:'📖',e:'Book',s:'Libro'}]
};

// --- PACKS CRUCIGRAMA ---
const packs = [
    { id:0, title:"Colores", diff:"Fácil", s:3, l:[['R','E','D'],['#','#','O'],['#','#','G']], c:["1. Color de la sangre","2. Animal que ladra"], sol:{'0-0':'R','0-1':'E','0-2':'D','1-2':'O','2-2':'G'} },
    { id:1, title:"Mascotas", diff:"Fácil", s:4, l:[['C','A','T','#'],['#','#','O','#'],['#','#','A','#'],['#','#','D','#']], c:["1. Animal que dice miau","2. Animal verde que salta"], sol:{'0-0':'C','0-1':'A','0-2':'T','1-2':'O','2-2':'A','3-2':'D'} },
    { id:2, title:"Números", diff:"Medio", s:4, l:[['T','E','N','#'],['W','#','I','#'],['O','#','N','#'],['#','#','E','#']], c:["1. Número 10","2. Número 2","3. Número 9"], sol:{'0-0':'T','0-1':'E','0-2':'N','1-0':'W','2-0':'O','1-2':'I','2-2':'N','3-2':'E'} },
    { id:3, title:"Familia", diff:"Medio", s:5, l:[['M','O','M','#','#'],['#','#','O','#','#'],['#','#','T','#','#'],['#','#','H','#','#'],['#','#','E','R','#']], c:["1. Mamá (Forma corta)","2. Madre (Forma larga)"], sol:{'0-0':'M','0-1':'O','0-2':'M','1-2':'O','2-2':'T','3-2':'H','4-2':'E','4-3':'R'} },
    { id:4, title:"Cuerpo", diff:"Difícil", s:7, l:[['H','A','N','D','#','#','#'],['E','#','#','#','L','#','#'],['A','#','#','#','E','#','#'],['D','#','#','#','G','#','#'],['#','#','#','#','#','#','#'],['#','N','O','S','E','#','#'],['#','#','#','#','#','#','#']], c:["1. Mano (5 dedos)","2. Nariz para oler","3. Cabeza","4. Pierna"], sol:{'0-0':'H','0-1':'A','0-2':'N','0-3':'D', '5-1':'N','5-2':'O','5-3':'S','5-4':'E', '0-0':'H','1-0':'E','2-0':'A','3-0':'D', '1-4':'L','2-4':'E','3-4':'G'} },
    { id:5, title:"Frutas", diff:"Difícil", s:6, l:[['A','P','P','L','E','#'],['#','#','E','#','#','#'],['#','#','A','#','#','#'],['#','#','R','#','#','#'],['#','#','#','#','#','#'],['#','#','#','#','#','#']], c:["1. Fruta roja","2. Fruta verde"], sol:{'0-0':'A','0-1':'P','0-2':'P','0-3':'L','0-4':'E','1-2':'E','2-2':'A','3-2':'R'} }
];

let currentPack=null, selectedCell={r:-1,c:-1}, currentDir='H', gridState=[];

window.onload = () => {
    document.getElementById('points').innerText = pts;
    window.speechSynthesis.getVoices();
};

function enterApp() { 
    document.getElementById('welcomeScreen').style.transform = "translateY(-100%)"; 
    playSfx('win'); 
    speak(""); 
}

function speak(txt, lang='en-US') {
    window.speechSynthesis.cancel();
    let u = new SpeechSynthesisUtterance(txt);
    u.lang = lang;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
}
function openModal(id){document.getElementById(id).style.display='flex';}
function closeModal(id){document.getElementById(id).style.display='none';}

// --- LOGICA CATEGORIAS ---
function openCategory(cat, title) {
    openModal('modalCategory');
    document.getElementById('catTitle').innerText = title;
    let g = document.getElementById('catGrid'); g.innerHTML = '';
    if(db[cat]) {
        db[cat].forEach(i => {
            let d = document.createElement('div'); d.className='vocab-item';
            d.innerHTML = `<div class="v-icon">${i.i}</div><div class="v-word">${i.s}</div>`;
            d.onclick = () => speak(i.sound || i.e);
            g.appendChild(d);
        });
    }
}

// --- TRADUCTOR DE VOZ MEJORADO (SEGURIDAD IOS) ---
function startVoiceTranslation() {
    if(isListening) {
        if(recognition) recognition.stop();
        resetMic();
        return;
    }

    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) { alert("Tu celular no soporta voz. Usa Chrome o Safari."); return; }
    
    recognition = new Speech();
    let sourceLang = document.getElementById('sourceLang').value;
    recognition.lang = sourceLang;
    recognition.interimResults = false;
    
    let mic = document.getElementById('micBtn');
    let status = document.getElementById('voiceStatus');
    let targetLang = document.getElementById('targetLang').value;
    
    mic.classList.add('listening');
    status.innerText = "Escuchando... (Habla ahora)";
    isListening = true;
    
    recognition.onresult = (event) => {
        const text = event.results[0][0].transcript;
        translateAndSpeak(text, targetLang);
    };
    recognition.onerror = (e) => {
        status.innerText = "No te escuché bien, intenta de nuevo.";
        resetMic();
    };
    recognition.onend = () => {
        resetMic();
    };

    try {
        recognition.start();
    } catch(e) {
        resetMic();
        alert("Error al iniciar micrófono. Refresca la página.");
    }
}

function resetMic() {
    isListening = false;
    document.getElementById('micBtn').classList.remove('listening');
}

async function translateAndSpeak(text, targetLang) {
    try{
        let sourceLangCode = document.getElementById('sourceLang').value.split('-')[0];
        
        // GOOGLE TRANSLATE API (UNOFFICIAL)
        let url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLangCode}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        
        let r = await fetch(url);
        let j = await r.json();
        let trans = j[0][0][0];
        
        const flags = {en:'🇺🇸', fr:'🇫🇷', de:'🇩🇪', it:'🇮🇹', pt:'🇧🇷', ja:'🇯🇵', ru:'🇷🇺', zh:'🇨🇳', es:'🇪🇸'};
        document.getElementById('voiceStatus').innerText = `${text} ➝ ${trans} ${flags[targetLang]||''}`;
        
        let voiceLang = targetLang;
        if(targetLang==='en') voiceLang='en-US'; if(targetLang==='es') voiceLang='es-ES';
        if(targetLang==='fr') voiceLang='fr-FR'; if(targetLang==='de') voiceLang='de-DE';
        if(targetLang==='it') voiceLang='it-IT'; if(targetLang==='pt') voiceLang='pt-BR';
        if(targetLang==='ja') voiceLang='ja-JP'; if(targetLang==='ru') voiceLang='ru-RU';
        if(targetLang==='zh') voiceLang='zh-CN';

        speak(trans, voiceLang);
    } catch(e) { speak("Error en traducción"); }
}

// --- CRUCIGRAMA ---
function openCrosswordMenu() {
    openModal('packsScreen');
    let g = document.getElementById('packsGrid'); g.innerHTML = '';
    packs.forEach((cw, idx) => {
        let col = cw.diff==="Fácil"?'#4caf50':(cw.diff==="Medio"?'#ff9800':'#f44336');
        let c = document.createElement('div'); c.className = 'cw-pack-card';
        c.innerHTML = `<div class="cw-pack-stripe" style="background:${col}"></div><div class="cw-pack-info"><div class="cw-pack-title">${cw.title}</div><div class="cw-pack-meta">${cw.s}x${cw.s} • ${cw.diff}</div></div>`;
        c.onclick = () => loadCrossword(idx);
        g.appendChild(c);
    });
}
function closePacks() { document.getElementById('packsScreen').style.display='none'; }
function closeGame() { document.getElementById('gameScreen').style.display='none'; }

function loadCrossword(idx) {
    currentPack = packs[idx];
    document.getElementById('gameTitle').innerText = currentPack.title;
    document.getElementById('gameScreen').style.display = 'flex';
    buildBoard(currentPack);
}

function buildBoard(pack) {
    const board = document.getElementById('gridTable');
    board.style.gridTemplateColumns = `repeat(${pack.s}, 1fr)`;
    board.innerHTML = '';
    gridState = [];

    for(let r=0; r<pack.s; r++) {
        let rowArr = [];
        for(let c=0; c<pack.s; c++) {
            const char = pack.l[r][c];
            const cell = document.createElement('div');
            if(char === '#') cell.className = 'cw-cell black';
            else {
                cell.className = 'cw-cell';
                const input = document.createElement('input');
                input.className = 'trans-input'; input.style.background='transparent'; input.style.border='none'; input.maxLength=1; input.style.fontWeight='900'; input.style.textTransform='uppercase';
                input.dataset.r = r; input.dataset.c = c;
                input.onfocus = () => selectCell(r, c);
                input.onkeyup = (e) => handleInput(e, input);
                cell.appendChild(input);
            }
            board.appendChild(cell);
            rowArr.push({el:cell, sol:char});
        }
        gridState.push(rowArr);
    }
}

function selectCell(r,c) {
    selectedCell = {r,c};
    const clue = currentPack.c.join(' | ');
    document.getElementById('currentClueDisplay').innerText = clue;
}

function handleInput(e, input) {
    if(e.key.match(/[a-z]/i)) {
        const all = Array.from(document.querySelectorAll('.cw-cell:not(.black) input'));
        const idx = all.indexOf(input);
        if(idx < all.length-1) all[idx+1].focus();
    }
}

function checkCrossword() {
    let correct = true;
    document.querySelectorAll('.cw-cell:not(.black) input').forEach(inp => {
        const r = inp.dataset.r; const c = inp.dataset.c;
        const sol = currentPack.sol[`${r}-${c}`];
        if(inp.value.toUpperCase() === sol) { inp.style.color="green"; inp.parentElement.style.background="#e8f5e9"; }
        else { inp.style.color="red"; inp.parentElement.style.background="#ffebee"; correct=false; }
    });
    if(correct) { playSfx('win'); speak("Excellent!"); setTimeout(closeGame, 2000); }
}

// --- OTROS FUNCIONES ---
async function doTranslate(){let t=document.getElementById('transIn').value; if(!t)return; try{let r=await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=es|en`); let j=await r.json(); document.getElementById('transOut').innerText=j.responseData.translatedText;}catch(e){}}

function openStages(){ openModal('modalStages'); let c=document.getElementById('pathContainer'); c.innerHTML=''; for(let i=1;i<=10;i++){let d=document.createElement('div'); d.className=i<=unlockedLevel?'section-node':'section-node locked'; d.innerHTML=`<div class="section-icon">${i<=unlockedLevel?'⭐':'🔒'}</div><div class="section-label">Nivel ${i}</div>`; if(i<=unlockedLevel)d.onclick=()=>startQuiz(i); c.appendChild(d); if(i<10){let l=document.createElement('div'); l.className='path-line'; c.appendChild(l);}} }
let curQ=[], curQI=0;
function startQuiz(l){
    let s=[...db.animals,...db.fruits,...db.colors]; curQ=[];
    for(let i=0;i<10;i++){ let c=s[Math.floor(Math.random()*s.length)], w1=s[Math.floor(Math.random()*s.length)], w2=s[Math.floor(Math.random()*s.length)]; curQ.push({q:`¿Cómo se dice ${c.s}?`, a:c.e, o:[c.e,w1.e,w2.e].sort(()=>Math.random()-0.5)}); }
    curQI=0; openModal('modalQuiz'); showQ();
}
function showQ(){
    if(curQI>=10){ playSfx('win'); speak("Level Up!"); if(unlockedLevel<10){unlockedLevel++; localStorage.setItem('unlockedLevel',unlockedLevel);} closeModal('modalQuiz'); openStages(); return; }
    let q=curQ[curQI]; document.getElementById('quizBar').style.width=((curQI/10)*100)+'%'; document.getElementById('quizPrompt').innerText=q.q;
    let c=document.getElementById('quizOptions'); c.innerHTML='';
    q.o.forEach(t=>{let b=document.createElement('div'); b.className='quiz-option'; b.innerText=t; b.onclick=()=>{if(t===q.a){b.className+=' correct'; playSfx('correct'); speak("Correct"); setTimeout(()=>{curQI++; showQ();},1000);}else{b.className+=' wrong'; playSfx('wrong'); speak("Wrong");}}; c.appendChild(b);});
}

function initSoccer(){openModal('modalSoccer'); newKick();}
function newKick(){document.getElementById('ball').style.bottom="10px"; let q=db.animals[Math.floor(Math.random()*db.animals.length)], w=db.animals[Math.floor(Math.random()*db.animals.length)]; document.getElementById('socQ').innerText=q.s; document.getElementById('socBtns').innerHTML=[`<button class="game-btn" onclick="kick(true,'${q.e}')">${q.e}</button>`, `<button class="game-btn" style="background:#ff9100" onclick="kick(false,'')">${w.e}</button>`].sort(()=>Math.random()-0.5).join('');}
function kick(w,t){let b=document.getElementById('ball'), k=document.getElementById('keeper'); if(w){b.style.bottom="180px"; b.style.left="20%"; k.style.left="70%"; speak("Goal! "+t); playSfx('correct'); pts+=20; localStorage.setItem('pts',pts); document.getElementById('points').innerText=pts; setTimeout(newKick,1500);}else{k.style.left="45%"; b.style.bottom="50px"; speak("Wrong"); playSfx('wrong'); setTimeout(newKick,1000);}}

let hmT="", hmL=5, hmG=[];
function initHangman(){openModal('modalHangman'); let i=db.animals[Math.floor(Math.random()*db.animals.length)]; hmT=i.e.toUpperCase(); hmL=5; hmG=[]; document.getElementById('hmHint').innerText="Traduce: "+i.s; rHm(); rHmK();}
function rHm(){document.getElementById('hmLives').innerText="❤️".repeat(hmL); let s=hmT.split('').map(l=>hmG.includes(l)?l:"_").join(" "); document.getElementById('hmWord').innerText=s; if(!s.includes("_")){speak("Win!"); setTimeout(initHangman,2000);} if(hmL<=0){speak("Lost"); setTimeout(initHangman,2000);}}
function rHmK(){let k=document.getElementById('hmKb'); k.innerHTML=""; "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('').forEach(l=>{let b=document.createElement('button'); b.className='key'; b.innerText=l; b.onclick=()=>{b.disabled=true; hmG.push(l); if(!hmT.includes(l))hmL--; rHm();}; k.appendChild(b);});}

function initMemory(){openModal('modalMemory'); let a=[]; for(let i=0;i<4;i++){let x=db.animals[Math.floor(Math.random()*db.animals.length)]; a.push({v:x.i,m:x.e},{v:x.e,m:x.i});} a.sort(()=>Math.random()-0.5); let g=document.getElementById('memGrid'); g.innerHTML=""; let mF=[]; a.forEach(x=>{let c=document.createElement('div'); c.className='mem-card'; c.innerText=x.v; c.onclick=()=>{if(mF.length<2&&!c.classList.contains('flipped')){c.classList.add('flipped'); mF.push({e:c,v:x.v,m:x.m}); if(mF.length==2){if(mF[0].v===mF[1].m){speak("Good"); playSfx('correct'); mF=[];}else setTimeout(()=>{mF.forEach(z=>z.e.classList.remove('flipped')); mF=[];},1000);}}}; g.appendChild(c);});}

function initChess(){openModal('modalChess');}
function chessAnswer(c){if(c){speak("Correct"); playSfx('correct'); setTimeout(()=>closeModal('modalChess'),2000);}else{speak("Wrong"); playSfx('wrong');}}
function confetti() { for(let i=0; i<20; i++){let d=document.createElement('div'); d.innerHTML='🎉'; d.className='confetti'; d.style.left=Math.random()*100+'%'; d.style.animationDuration=(Math.random()*2+1)+'s'; document.body.appendChild(d); setTimeout(()=>d.remove(),3000);} }