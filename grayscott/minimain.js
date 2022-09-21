//Essentially a file of the new functions



//NOTe to self: CHeck intensity of points on grid
//Map this to the colour bar by hexcode
// correspond this to the value on the bar.









//This line breaks some of the code but I don't know whether I should remove it
//const { default: katex } = require("katex");


///////////////////////////////////////////////////////////// The block to get button working
    
//Gets the users input from the box
function getVal(){
    const val = document.querySelector('input').value;
    return val;
}


//A&A this bit gets messy so heres an explanation

//BLOCK 1: This converts user based maths into GLSL allowed maths. 
//EG: The string: 'u + v^2 + 1' ---> 'u + pow(v,2) + 1'

//BLOCK 2: Turns all integers into floats. Uses some regex I don't understand but it works.
// EG: 'u + pow(v,2) + 1' ---> 'u + pow(v,2.00000) + 1.0000'

//BLOCK 3: Takes the variables we have defined and changes them to their shader variants
// EG: 'u + pow(v,2.00000) + 1.0000' ---> 'uv.r + pow(uv.g,2.00000) + 1.0000'

//Converts user input into shader script
function functoshader(STR){

//BLOCK 1: Only works for integers. The inbuilt pow(x,y) in GLSL only works for y >= 0
    for (var i = 0; i < STR.length; i++) {//x^y --> pow(x,y)
        if(STR[i] == '^'){
            //This creates the pow(x,y) string
            var replace = 'pow' + '(' + STR[i-1] + ',' + STR[i+1] +  ')';
            //Remove the adjacent characters
            STR = STR.substring(0,i-1) + '^' + STR.substring(i+2,STR.length);
            //End up with x^y ---> pow(x,y)
            STR = STR.replace('^',replace);
        }
      }


      //BLOCK 2:
      //Adam and Andrew I don't know how to explain this regex
      //I'm just going to link the Stackoverflow I stole it from:
      //https://stackoverflow.com/questions/17374893/how-to-extract-floating-numbers-from-strings-in-javascript

    var regex = /[+-]?\d+(\.\d+)?/g;
 //Produces array of numbers from  input string
    var ints = STR.match(regex).map(function(v) { return parseFloat(v); }); 
   //Produces array of string of numbers from input string
    var stringints = STR.match(regex);  
    for(var i = 0; i < stringints.length; i++){
        //This line didn't do what I intended but it works so whatever
        if(Number.isInteger(stringints[i]) == false){
            //Replaces all numbers with their 5dp versions.
      STR = STR.replace(stringints[i],ints[i].toFixed(5))
      }
    }



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    //BLOCK 3:
    var STR = STR.replace(/u/g, `x`); //replaces all instances of (u,v) with (uv.r,uv.g)
    var STR = STR.replace(/v/g, `y`);
    var STR = STR.replace(/x/g, 'uv.r');
    var STR = STR.replace(/y/g, 'uv.g');


    //This deals with the kinetic constants 'a' 'b' 'c'
    if(STR.includes('a') || STR.includes('b') || STR.includes('c')){
        STR = STR.replace(/a/g, 'KA');
        STR = STR.replace(/b/g, 'KB');
        STR = STR.replace(/c/g, 'KC');

    }

    return STR
} //This is an improvement on the code below.

// function functoshader(){
// var fstr = document.getElementById('F').value; // String of user input from f(x,y)
// var gstr = document.getElementById('G').value; // String of user input from g(x,y)

// // Changes instances of u,v to uv.r,uv.g for use in shader language for f(u,v). This is spaghetti
// var fstr1 = fstr.replace(/u/g, `x`); 
// var fstr2 = fstr1.replace(/v/g, `y`);


// var gstr1 = gstr.replace(/u/g, `x`); 
// var gstr2 = gstr1.replace(/v/g, `y`);

// var GSTR1 = gstr2.replace(/x/g, 'uv.r');
// var GSTR = GSTR1.replace(/y/g, 'uv.g');
// return [FSTR,GSTR]
// }


function ShowHide(id){
    //id is document.getElementbyId(id)
    var x = id;
    if (x.style.display === "none") {
      x.style.display = "block";
    } else {
      x.style.display = "none";
    }
  }



function insertHTML(html, dest, append=false){
// if no append is requested, clear the target element
if(!append) dest.innerHTML = '';
// create a temporary container and insert provided HTML code
let container = document.createElement('div');
container.innerHTML = html;
// cache a reference to all the scripts in the container
let scripts = container.querySelectorAll('script');
// get all child elements and clone them in the target element
let nodes = container.childNodes;
for( let i=0; i< nodes.length; i++) dest.appendChild( nodes[i].cloneNode(true) );
// force the found scripts to execute...
for( let i=0; i< scripts.length; i++){
    let script = document.createElement('script');
    script.type = scripts[i].type || 'text/javascript';
    if( scripts[i].hasAttribute('src') ) script.src = scripts[i].src;
    script.innerHTML = scripts[i].innerHTML;
    document.head.appendChild(script);
    document.head.removeChild(script);
}
// done!
return true;
}

//This is what is called when GO! is pressed
function Change() {

    //Inserts the altered script into the shader
    insertHTML(stringscript(),document.getElementById('gsFragmentShader'))
    

    //Changes the pretty math function stuff
    var Fval = '\\frac{\\partial u}{\\partial t} = D_1 \\Delta u +' + document.getElementById('F').value;
    var Gval = '\\frac{\\partial u}{\\partial t} = D_1 \\Delta u +' + document.getElementById('G').value;

    //This is in the katex documentation somewhere
    katex.render(Fval,functionSolveF)
    katex.render(Gval,functionSolveG)
   
    
    return true;

}

function stringscript(){
                        
    var fFunc = functoshader(document.getElementById('F').value);
    var gFunc = functoshader(document.getElementById('G').value);
    // The script that we want to inject into the new body
    var script = `
    varying vec2 vUv;
    uniform float screenWidth;
    uniform float screenHeight;
    uniform sampler2D tSource;
    uniform float delta;  // ||This is equivalent to dt in the forward euler.||
    uniform float feed;
    uniform float kill;
    uniform vec2 brush;

    // Kinetic parameters DONE
    uniform float KA;
    uniform float KB;
    uniform float KC;
    uniform float KD;

    // ||GLSL DOESNT CARE FOR STRINGS||
    vec2 texel = vec2(1.0/screenWidth, 1.0/screenHeight);

    // ||This is equivalent to dx and dy.||
    float step_x = 1.0/screenWidth;
    float step_y = 1.0/screenHeight; 
    void main()
    {
        if(brush.x < -5.0)
        {
            gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
            return;
        }
        
        //float feed = vUv.y * 0.083;
        //float kill = vUv.x * 0.073;
        


        //|| the euler step TODO:||

        vec2 uv = texture2D(tSource, vUv).rg;
        vec2 uv0 = texture2D(tSource, vUv+vec2(-step_x, 0.0)).rg;
        vec2 uv1 = texture2D(tSource, vUv+vec2(step_x, 0.0)).rg;
        vec2 uv2 = texture2D(tSource, vUv+vec2(0.0, -step_y)).rg;
        vec2 uv3 = texture2D(tSource, vUv+vec2(0.0, step_y)).rg;
        
        vec2 lapl = (uv0 + uv1 + uv2 +  uv3 - 4.0*uv);//10485.76;

                            //  ||Diffusion coefficients|| (And Forward Euler)||                  
        float du = /*0.00002*/feed*lapl.r + ${fFunc}; 
        float dv = /*0.00001*/kill*lapl.g  + ${gFunc};
        vec2 dst = uv + delta*vec2(du, dv);
        
        if(brush.x > 0.0) 
        {
            vec2 diff = (vUv - brush)/texel;
            float dist = dot(diff, diff);
            if(dist < 5.0)
                dst.g = 0.9;
        }
         
        gl_FragColor = vec4(dst.r, dst.g, 0.0, 1.0);
    }`
    return script

}
