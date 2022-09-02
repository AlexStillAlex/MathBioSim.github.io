//Essentially a file of the new functions




///////////////////////////////////////////////////////////// The block to get button working
    
//Gets the users input from the box
function getVal(){
    const val = document.querySelector('input').value;
    return val;
}

//TODO: text to maths function
//get input from boxes
//convert to string
//convert it to something resembling latex
//inject it
// hope the try/catch stuff is done beforehand
//

//Converts user input into shader script
function functoshader(){
var fstr = document.getElementById('F').value; // String of user input from f(x,y)
var gstr = document.getElementById('G').value; // String of user input from g(x,y)

// Changes instances of u,v to uv.r,uv.g for use in shader language for f(u,v). This is spaghetti
var fstr1 = fstr.replace(/u/g, `x`); 
var fstr2 = fstr1.replace(/v/g, `y`);

var FSTR1 = fstr2.replace(/x/g, 'uv.r');
var FSTR = FSTR1.replace(/y/g, 'uv.g')


var gstr1 = gstr.replace(/u/g, `x`); 
var gstr2 = gstr1.replace(/v/g, `y`);

var GSTR1 = gstr2.replace(/x/g, 'uv.r');
var GSTR = GSTR1.replace(/y/g, 'uv.g');




return [FSTR,GSTR]

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

function Change() {

    insertHTML(stringscript(),document.getElementById('gsFragmentShader'))
    
    var Fval = 'D_1 * nabla^2 (u) + ' + document.getElementById('F').value;
    var Gval = 'D_2 * nabla^2 (v) + ' + document.getElementById('G').value;
    insertHTML(`Where we solve:<br>
                du/dt = ${Fval}<br>
                dv/dt = ${Gval}`, 
                document.getElementById('functionInfo'))
    
    return true;

}

function stringscript(){
                        
    var fFunc = functoshader()[0];
    var gFunc = functoshader()[1];
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
