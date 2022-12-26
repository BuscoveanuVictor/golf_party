function _(elmnt){return document.getElementById(elmnt)}
function getCss(elmnt){return getComputedStyle(elmnt)}
function drawLine(xFrom,yFrom,xTo,yTo,width=2,color='black'){
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(xFrom, yFrom);
    ctx.lineTo(xTo,yTo)
    ctx.stroke();
}
function canvas_arrow(fromX, fromY, toX, toY) {
    var headlen = 10; // length of head in pixels
    ctx.lineWidth = 1;
    var dx = toX - fromX;
    var dy = toY - fromY;
    var angle = Math.atan2(dy, dx);
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
}
function _canvas(){ 
    /*
        Am scazut canvas.width respectiv height, deoarece pozitia intiala
        a coltului canvasului este la mijlocul paginii si folosim translate 
        ca pozitiona canvas ul in mijloc
        "getCss('canvas').left - reprezinta locul coltului initial inainte de translate
    */  
    let canvasLeft = getNumber(getCss(_('canvas')).left)-canvas.width/2;
    let canvasTop =  getNumber(getCss(_('canvas')).top)-canvas.height/2;

    return{
        left : canvasLeft,
        top : canvasTop,
    }
}
function contor(counter){
    if(_('counter')!=null)_('counter').parentNode.removeChild(_('counter'));
    let p = `<p id='counter' >No of strikes : ${counter} </p>`;
    _('id-div').insertAdjacentHTML('afterbegin',p);
    _('counter').style.left =  `${_canvas().left+10}px`;
    _('counter').style.top = `${_canvas().top-40}px`;
}
const img = new Image();  
img.src = 'images/redArrow.png';
function redArrow(coordX,coordY){
    let dif = 4;
    let time = 100;
    let increment = -0.2;
    let myInterval = setInterval(()=>{
        game.draw();
        ctx.drawImage(img,coordX,coordY+dif,20,33);
        dif = dif + increment;
        if(dif<0 || dif>4)increment = -increment;
        if(time>0)time--;
        else {game.draw();clearInterval(myInterval);}
    },10)
}
function getNumber(elem){
    var i=0, nr=0;
    while(elem[i]>='0' && elem[i]<='9'){
        nr = nr*10 + Number(elem[i]);
        i++;
    }
    return nr;
}
function playAudio(){
    let audio = new Audio('hittingBall.m4a');
    audio.play();
}

const mBall = 45; //masa minge in grame
const coefFrecare = 0.07;
const fortaFrecare = coefFrecare * mBall/1000 * 9.81; 

const lungimeMaximaArrow = 150;
const lungimeMinimaArrow = 10;

const vitezaMinima = 0.6;

const canvas=_('canvas');
const ctx = canvas.getContext('2d');

let myEvent;

let game;

class GolfParty{

    constructor(){

        this.objArray = []; //vectorul de obiecte pentru prima jumatate - (first ball)
        this.objArray2 = []; //vectorul de obiecte pentru a doua jumatate - (second ball)

        this.createLevel('beginner');

        this.ball = new Ball(200,460,5,this.objArray);
        this.ball2 = new Ball(600,460,5,this.objArray2);

        this.noStrikes = 0;
    }

    draw(){
        ctx.clearRect(0,0,canvas.width,canvas.height);
           
        for(let i=0; i<this.objArray.length; i++){
            this.objArray[i].draw();
        }

        for(let i=0; i<this.objArray2.length; i++){
            this.objArray2[i].draw();
        }

        ctx.fillStyle ='black';
       
        //ctx.fillRect(canvas.width/2-250,canvas.height/2-250,500,400);

        this.ball.draw();
        this.ball2.draw();
    }

    createLevel(level){
        switch(level){
            case 'beginner':
                this.objArray.push(new GolfHole(205,60,6));
                this.objArray2.push(new GolfHole(605,60,6));

                this.objArray.push(new Obstacle(canvas.width/2,0,10,canvas.height,'white'));
                this.objArray2.push(new Obstacle(canvas.width/2,0,10,canvas.height,'white'));

                this.objArray.push(new Obstacle(45,130,80,80,'red'));
                this.objArray.push(new Obstacle(165,130,80,80,'yellow'));
                this.objArray.push(new Obstacle(285,130,80,80,'blue'));

                this.objArray2.push(new Obstacle(445,130,315,80,'green'));
            break;
        }
    }  
}

class Ball {

    constructor(coordX,coordY,raza,array){
        this.gameStarted =  false;
        this.gameOver = false;
        this.mousedown = false;
        this.raza = raza;
        this.coordX = coordX;
        this.coordY = coordY;
        this.objArray = array;
        this.speed = null ;

       
    }

    draw(){
        ctx.fillStyle='black';
        ctx.beginPath();
        ctx.arc(this.coordX,this.coordY,this.raza,0,2 * Math.PI);
        ctx.fill();
    }

    verifyIfClickedOnBall(mouseCoordX,mouseCoordY){
        if((mouseCoordX>=this.coordX-this.raza && mouseCoordX<=this.coordX+this.raza) 
            &&(mouseCoordY>=this.coordY-this.raza  && mouseCoordY<=this.coordY+this.raza)){
                this.mousedown = true; 
        }
    }

    determineCoordsOfPointingArrow(mouseCoordX,mouseCoordY){
        
        //Coordonatele bilei relativ la coltul ferestrei 
        let windowCoordBallX = this.coordX+_canvas().left;
        let windowCoordBallY = this.coordY+_canvas().top;
    
        //Proiectile vectorului directie pe axele de coord(ale ferestrei nu ale canvasului) cand tragi de bila
        this.difX = windowCoordBallX - mouseCoordX;
        this.difY = windowCoordBallY - mouseCoordY; 
    
        //Lungimea segmentului sagetii
        var lungime = Math.sqrt(this.difX*this.difX+this.difY*this.difY);

        //Recalcularea proiectilor in fct de lungime
        if(lungime>=lungimeMaximaArrow){
            /* 
                THALES -> vrem ca raportul dintre lungimea curenta si lungimea maxima(care este de 150) a sagetii sa fie egal cu raportul dintre 
                proiectiile pe axele de coord ale ferestrei si proiectile actuale care definesc lugimea sagetii
            */
            this.difY = Math.round((this.difY * lungimeMaximaArrow)/lungime);
            this.difX = Math.round((this.difX * lungimeMaximaArrow)/lungime);
        }
    
        //Coord pe care pointeaza sageata
        let xArrow = this.coordX + this.difX;
        let yArrow = this.coordY + this.difY;         

        //Trimit coord doar daca lungimea >=20 -> viteza minima
        if(lungime>=lungimeMinimaArrow){
            this.throwable = true;
            return {x:xArrow, y:yArrow};
        }else {
            this.throwable = false;
            return  null;
        }
    }

    determine_Direction_Speed_And_Angle(){
       
        let lungime = Math.sqrt(this.difX*this.difX+this.difY*this.difY);  //Lungimea sagetii
        let speed = Math.round((lungime*vitezaMinima)/lungimeMinimaArrow);  //Calcularea vitezii in fct de lungimea sagetii
        
        //Determin in ce directie o ia bila in fuctie de cadarul 
        //in care se afla vectorul directie(in fuctie de proiectiile acestuia)
        if     (this.difX>=0 && this.difY>=0){this.signX= 1; this.signY= 1;}   //cadranul 1
        else if(this.difX<0 && this.difY>0){this.signX=-1; this.signY= 1;}   //cadranul 2
        else if(this.difX<=0 && this.difY<=0){this.signX=-1; this.signY=-1;}   //cadranul 3
        else if(this.difX>0 && this.difY<0){this.signX= 1; this.signY=-1;}   //cadranul 4
                
        //Se determina alpha(masurat in grade), fata de dreapta oX, la care se alfa vectorul dir
        let alpha = Math.acos(this.difX/lungime);
        alpha = (180*alpha)/Math.PI;
        if(alpha>=90)alpha=180-alpha;//reducere la primul cadran
        //Alpha masurat in radian
        alpha =  (Math.PI * alpha)/180;
    
        this.speed = speed;
        this.alpha = alpha;
        //console.log(speed)
    }

    throw(){
        playAudio();
        this.determine_Direction_Speed_And_Angle();     
        this.animate();
    }

    animate(){
        this.move();
        if(this.speed>0){
            requestAnimationFrame(this.animate.bind(this));  
            // bind = ii spunem compilatorului cine este this atunci 
            // cand va mai fi apelata functia animate ,prin callback, de catre
            // functia requestAnimationFrame -> cand intra a doua oara 
            // this-ul va fi defapt al 'obiectului' requestAnimationFrame

            //  !!!
            //  THIS -> 'obiectul' care il apeleaza
            //  adica functia daca se auto apeleaza this reprezinta 'f(pasul-1)'
        }else{
            this.speed = null;
            if(game.ball2.speed==null && game.ball.gameOver && !game.ball2.gameStarted && !game.ball2.gameOver){
                redArrow(game.ball2.coordX-10,game.ball2.coordY-42);
                //setez un timeout pentru afisarea sagetii rosii    
                setTimeout(()=>{game.ball2.gameStarted = true;},1000); 
            }
        }
    }

    move(){
        this.xSpeed = this.speed*Math.cos(this.alpha);
        this.ySpeed = this.speed*Math.sin(this.alpha);

        this.coordX += this.signX * this.xSpeed;
        this.coordY += this.signY * this.ySpeed; 

        this.verifingIfBallHitSomeObject().then((value)=>{
                if(!value){
                    this.coordX += this.signX * this.xSpeed;
                    this.coordY += this.signY * this.ySpeed; 
                } 
            }
        );
        this.speed -= fortaFrecare;
        game.draw();
    }

    async verifingIfBallHitSomeObject(){

        let bVef = 1;

        //Verificare lovire de peretii canvasului
        if(Math.floor(this.coordX-this.raza)<=0 || Math.ceil(this.coordX+this.raza)>=canvas.width)
        {
            this.signX = -this.signX; bVef=0;
        }
        if(Math.floor(this.coordY-this.raza)<=0 || Math.ceil(this.coordY+this.raza)>=canvas.height) 
        {
            this.signY = -this.signY; bVef=0;
        }

        //Verificare lovire cu obstacol
        if(bVef){
            for(let i=0; i<this.objArray.length; i++){  
                
                if(this.coordY+this.raza/2>=this.objArray[i].coordY && this.coordY-this.raza/2<=this.objArray[i].coordY+this.objArray[i].height)
                {
                    if(this.coordX+this.raza>=this.objArray[i].coordX && this.coordX+this.raza<=this.objArray[i].coordX+this.xSpeed+10) 
                        {
                            this.signX = -this.signX;  bVef=0;
                        }
                    
                    else if(this.coordX-this.raza<=this.objArray[i].coordX+this.objArray[i].width && this.coordX-this.raza>=this.objArray[i].coordX+this.objArray[i].width-this.xSpeed-10) 
                        {
                            this.signX = -this.signX;  bVef=0;
                        }
                }
                if(this.coordX+this.raza/2>=this.objArray[i].coordX  && this.coordX-this.raza/2<=this.objArray[i].coordX+this.objArray[i].width)
                {
                    if(this.coordY+this.raza>=this.objArray[i].coordY && this.coordY+this.raza<=this.objArray[i].coordY+this.ySpeed+10) 
                        {
                            this.signY = -this.signY;  bVef=0;     
                        }
                    else if(this.coordY-this.raza<=this.objArray[i].coordY+this.objArray[i].height && this.coordY-this.raza>=this.objArray[i].coordY+this.objArray[i].height-this.ySpeed-10) 
                        {                      
                            this.signY = -this.signY;  bVef=0;
                        }
                }
                // A intrat mingea in gaura
                if(bVef){
                    let distanceBallAndHole = Math.sqrt((Math.pow(this.coordX-this.objArray[0].coordX,2))+(Math.pow(this.coordY-this.objArray[0].coordY,2)))
                    
                    if(distanceBallAndHole-this.raza<=0 && this.speed<6 && !this.gameOver){
                        this.speed = 0;  bVef=0;
                        this.gameOver = true;

                        if(game.ball.gameOver && game.ball2.gameOver){
                            gameOVER();
                            console.log('game OVER')
                        }
                    }
                }
            }
        }
        return bVef;
    }
}

class Obstacle{
    constructor(xCoord,yCoord,width,height,color='grey'){
        this.width = width;
        this.height = height;
        this.coordX = xCoord;
        this.coordY = yCoord;
        this.color = color;
    }
    draw(){
        ctx.fillStyle = this.color;
        ctx.fillRect(this.coordX,this.coordY,this.width,this.height);
    }
}

class GolfHole{
    constructor(xCoord,yCoord,raza,color='grey'){
        this.coordX = xCoord;
        this.coordY = yCoord;
        this.raza = raza;
        this.color = color;
    }
    draw(){
        ctx.fillStyle=this.color;
        ctx.beginPath();
        ctx.arc(this.coordX,this.coordY,this.raza,0,2 * Math.PI);
        ctx.fill();
        
        let color = 0;
        for(let raza=this.raza+2; raza>=0; raza-=0.01){
            ctx.fillStyle = `rgb(${color},${color},${color})`;
            ctx.beginPath();
            ctx.arc(this.coordX,this.coordY, raza ,0,2 * Math.PI);
            ctx.fill();
            color += 0.35;
        }
    }
}


function newGame(){
    if(game){
        game=null;
        removeButoane();
    }
    game =  new GolfParty();
    contor(game.noStrikes);
    redArrow(game.ball.coordX-10,game.ball.coordY-42);
    setTimeout(()=>{game.ball.gameStarted = true;},1000); 
    // setez un timeout pentru afisarea sagetii rosii ca sa NU
    // fie interferata de functia draw (care va sterge sageata rosie)  
}
window.onload = newGame();

window.onmouseup = (e)=>{
    console.log(e.x,e.y);
    //Arunc cele 2 mingi pentru cazul in care mingea 2 depinde de mingea 1
    if((game.ball.mousedown && !game.ball.gameOver) 
        && (game.ball.throwable && game.ball.speed==null)){
            game.ball.throw();
            if(!game.ball2.gameOver){
                game.ball2.throw();
            }
           
            contor(++game.noStrikes);
    } // Arunc mingea 2 pentru cazul in care aceasta nu mai depinde de mingea 1
    else if((game.ball2.mousedown && !game.ball2.gameOver) 
    && (game.ball2.throwable && game.ball2.speed==null)){
        game.ball2.throw();
        contor(++game.noStrikes);
    }
    game.ball.mousedown = game.ball2.mousedown = false;
}
const mouse ={
    clicked : false,
    x : undefined,
    y : undefined
}
canvas.onmousedown = (e) =>{
    console.log('x : ',e.offsetX,' y : ',e.offsetY);
    //Game started este o var care imi indica faptul ca sageata rosie a fost ilustrata si pot incepe jocu
    if(game.ball.gameStarted && !game.ball.gameOver)game.ball.verifyIfClickedOnBall(e.offsetX,e.offsetY);
    if(game.ball2.gameStarted && !game.ball2.gameOver)game.ball2.verifyIfClickedOnBall(e.offsetX,e.offsetY);
}

canvas.onmousemove = (e) =>{
    if(mouse.clicked){
        ctx.fillRect(mouse.x,mouse.y,e.offsetX-mouse.x,e.offsetY-mouse.y);
    }
    console.log('x : ',e.offsetX,' y : ',e.offsetY);
    if(game.ball.gameOver && game.ball2.gameOver) 
        if((e.offsetX>=515 && e.offsetX<=535) && (e.offsetY>=330 && e.offsetY<=350)){
            console.log('arrow')
        }
}
window.onmousemove = (e) =>{
    //Aici desenez sagetile atunci cand mingea a doua depinde de prima 
    if(game.ball.mousedown && !game.ball.gameOver){
        let arrow = game.ball.determineCoordsOfPointingArrow(e.x,e.y);
        //ball 2 primeste vectorii pozitie a mingii 1 pt afisarea sagetii dar si pentru calcularea vitezei, directii ... 
        game.ball2.difX = game.ball.difX;
        game.ball2.difY = game.ball.difY;
        if(arrow!=null ){
            game.draw(); //redesendez jocu dupa care afis sagetile(daca era la sf stergeam sagetile)
            canvas_arrow(game.ball.coordX,game.ball.coordY,arrow.x,arrow.y,game.ctx);  
            if(!game.ball2.gameOver){ 
                let xArrowBall2 = game.ball2.coordX + game.ball2.difX;
                let yArrowBall2 = game.ball2.coordY + game.ball2.difY;
                canvas_arrow(game.ball2.coordX,game.ball2.coordY,xArrowBall2,yArrowBall2,game.ctx); 
            }
        }
    }
    //Aici dezenez sageata pt mingea a doua pentru atunci cand primul joc a fost terminat 
    if(game.ball2.mousedown && !game.ball2.gameOver){
        let arrow = game.ball2.determineCoordsOfPointingArrow(e.x,e.y);
        if(arrow!=null ){
            game.draw(); 
            canvas_arrow(game.ball2.coordX,game.ball2.coordY,arrow.x,arrow.y,game.ctx);  
        }
    }
}
window.onresize = ()=>{
    _('counter').style.left =  `${_canvas().left+10}px`;
    _('counter').style.top = `${_canvas().top-40}px`;
    if(game.ball.gameOver && game.ball2.gameOver) coordButoane();
}

const widthGO = 450;
const heightGO = 600;

let difW = 200;
let difH = 100;

let imagineGameOver = new Image();
imagineGameOver.src ='images/LEVELCOMPLETED.png';
let stea = new Image();
stea.src = 'images/stea.png';
let menu = new Image();
menu.src = 'images/menu-removebg-preview-removebg-preview.png';

function gameOVER(){
    let x = (difW+canvas.width-widthGO)/2;
    let y = (difH+canvas.height-heightGO)/2;
    if(difW!=0){
        game.draw();
        difW -=4;
        difH -=2;
        ctx.drawImage(imagineGameOver,x,y,widthGO-difW,heightGO-difH);
        ctx.font = "30px Arial";
        ctx.fillText(`No of strikes : ${game.noStrikes} `,x+110,y+300,400)
        requestAnimationFrame(gameOVER);  
    }
    else {
        puneStele(x,y);
        /*
            atribuim din nou valorile de baza 
            pentru urmatorul joc 
        */
        difW = 200;
        difH = 100;
    }
}
function puneStele(x,y){
    
    puneButoane();
    if(game.noStrikes>=1 && game.noStrikes<=6)ctx.drawImage(stea,x+165-70-10,y+152,100,100);
    if(game.noStrikes>=1 && game.noStrikes<=4)ctx.drawImage(stea,x+168,y+152,100,100);
    if(game.noStrikes>=1 && game.noStrikes<=2)ctx.drawImage(stea,x+165+75+10,y+152,100,100);
}

function puneButoane(){
    let html = "<button id='restartButton' onclick='newGame()'>⟳</button>\n";
    html += "<button id='nextButton'>Next</button>\n";
    html += "<button id='menuButton' onclick='Menu()'>☰</button>\n";

    _('id-div').insertAdjacentHTML('beforeend',html);
    coordButoane();
}

function removeButoane(){
    _('restartButton').parentNode.removeChild(_('restartButton'));
    _('nextButton').parentNode.removeChild(_('nextButton'));
    _('menuButton').parentNode.removeChild(_('menuButton'));
}

function coordButoane(){
    _('restartButton').style.left = `${_canvas().left+canvas.width/2 + 50}px`;
    _('restartButton').style.top =  `${_canvas().top+canvas.height/2 + 120}px`;

    _('nextButton').style.left = `${_canvas().left+canvas.width/2 - 60}px`;
    _('nextButton').style.top =  `${_canvas().top+canvas.height/2 + 120}px`;

    _('menuButton').style.left = `${_canvas().left+canvas.width/2 - 120}px`;
    _('menuButton').style.top =  `${_canvas().top+canvas.height/2 + 120}px`;
}


function Menu(){
    removeButoane();
    game.draw();
    ctx.drawImage(menu,100,100);
    console.log('ceva')
}