/*
 * Gray-Scott
 *
 * A solver of the Gray-Scott model of reaction diffusion.
 *
 * ©2012 pmneila.
 * p.mneila at upm.es
 */

(function(){

// Canvas.
var canvas;
var canvasQ;
var canvasWidth;
var canvasHeight;

var mMouseX, mMouseY;
var mMouseDown = false;

var mRenderer;
var mScene;
var mCamera;
var mUniforms;
var mColors;
var mColorsNeedUpdate = true;
var mLastTime = 0;

var mTexture1, mTexture2;
var mGSMaterial, mScreenMaterial;
var mScreenQuad;

var mToggled = false;

var mMinusOnes = new THREE.Vector2(-1, -1);


// Some presets.
var presets = [
    { // Default
        //feed: 0.018,
        //kill: 0.051
        feed: 0.037,
        kill: 0.06
    },
    { // Solitons
        feed: 0.03,
        kill: 0.062
    },
    { // Pulsating solitons
        feed: 0.025,
        kill: 0.06
    },
    { // Worms.
        feed: 0.078,
        kill: 0.061
    },
    { // Mazes
        feed: 0.029,
        kill: 0.057
    },
    { // Holes
        feed: 0.039,
        kill: 0.058
    },
    { // Chaos
        feed: 0.026,
        kill: 0.051
    },
    { // Chaos and holes (by clem)
        feed: 0.034,
        kill: 0.056
    },
    { // Moving spots.
        feed: 0.014,
        kill: 0.054
    },
    { // Spots and loops.
        feed: 0.018,
        kill: 0.051
    },
    { // Waves
        feed: 0.014,
        kill: 0.045
    },
    { // The U-Skate World
        feed: 0.062,
        kill: 0.06093
    }
];

// Configuration.
var feed = presets[0].feed;
var kill = presets[0].kill;


init = function()
{
    init_controls();

    canvasQ = $('#myCanvas');
    canvas = canvasQ.get(0);

    canvas.onmousedown = onMouseDown;
    canvas.onmouseup = onMouseUp;
    canvas.onmousemove = onMouseMove;

    mRenderer = new THREE.WebGLRenderer({canvas: canvas, preserveDrawingBuffer: true});

    mScene = new THREE.Scene();
    mCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10000, 10000);
    mCamera.position.z = 100;
    mScene.add(mCamera);

    mUniforms = {
        screenWidth: {type: "f", value: undefined},
        screenHeight: {type: "f", value: undefined},
        tSource: {type: "t", value: undefined},
        delta: {type: "f", value: 1.0},
        feed: {type: "f", value: feed},
        kill: {type: "f", value: kill},
        brush: {type: "v2", value: new THREE.Vector2(-10, -10)},
        color1: {type: "v4", value: new THREE.Vector4(0, 0, 0.0, 0)},
        color2: {type: "v4", value: new THREE.Vector4(0, 1, 0, 0.2)},
        color3: {type: "v4", value: new THREE.Vector4(1, 1, 0, 0.21)},
        color4: {type: "v4", value: new THREE.Vector4(1, 0, 0, 0.4)},
        color5: {type: "v4", value: new THREE.Vector4(1, 1, 1, 0.6)}
    };
    mColors = [mUniforms.color1, mUniforms.color2, mUniforms.color3, mUniforms.color4, mUniforms.color5];
    $("#gradient").gradient("setUpdateCallback", onUpdatedColor);

    mGSMaterial = new THREE.ShaderMaterial({
            uniforms: mUniforms,
            vertexShader: document.getElementById('standardVertexShader').textContent,
            fragmentShader: document.getElementById('gsFragmentShader').innerHTML,
        });
    mScreenMaterial = new THREE.ShaderMaterial({
                uniforms: mUniforms,
                vertexShader: document.getElementById('standardVertexShader').textContent,
                fragmentShader: document.getElementById('screenFragmentShader').innerHTML,
            });

    var plane = new THREE.PlaneGeometry(1.0, 1.0);
    mScreenQuad = new THREE.Mesh(plane, mScreenMaterial);
    mScene.add(mScreenQuad);

    mColorsNeedUpdate = true;

    resize(canvas.clientWidth, canvas.clientHeight);

    render(0);
    mUniforms.brush.value = new THREE.Vector2(0.5, 0.5);
    mLastTime = new Date().getTime();
    requestAnimationFrame(render);
}

var resize = function(width, height)
{
    // Set the new shape of canvas.
    canvasQ.width(width);
    canvasQ.height(height);

    // Get the real size of canvas.
    canvasWidth = canvasQ.width();
    canvasHeight = canvasQ.height();

    mRenderer.setSize(canvasWidth, canvasHeight);

    // TODO: Possible memory leak?
    mTexture1 = new THREE.WebGLRenderTarget(canvasWidth/2, canvasHeight/2,
                        {minFilter: THREE.LinearFilter,
                         magFilter: THREE.LinearFilter,
                         format: THREE.RGBAFormat,
                         type: THREE.FloatType});
    mTexture2 = new THREE.WebGLRenderTarget(canvasWidth/2, canvasHeight/2,
                        {minFilter: THREE.LinearFilter,
                         magFilter: THREE.LinearFilter,
                         format: THREE.RGBAFormat,
                         type: THREE.FloatType});
    mTexture1.wrapS = THREE.RepeatWrapping;
    mTexture1.wrapT = THREE.RepeatWrapping;
    mTexture2.wrapS = THREE.RepeatWrapping;
    mTexture2.wrapT = THREE.RepeatWrapping;

    mUniforms.screenWidth.value = canvasWidth/2;
    mUniforms.screenHeight.value = canvasHeight/2;
}

var render = function(time)
{
    var dt = (time - mLastTime)/20.0;
    if(dt > 0.8 || dt<=0)
        dt = 0.8;
    mLastTime = time;

    //##########################fragmentshaderupdate
    mGSMaterial.fragmentShader = document.getElementById('gsFragmentShader').innerHTML;
    mGSMaterial.needsUpdate = true;

    //#################################################


    mScreenQuad.material = mGSMaterial;
    mUniforms.delta.value = dt;
    mUniforms.feed.value = feed;
    mUniforms.kill.value = kill;

    for(var i=0; i<8; ++i)
    {
        if(!mToggled)
        {
            mUniforms.tSource.value = mTexture1;
            mRenderer.render(mScene, mCamera, mTexture2, true);
            mUniforms.tSource.value = mTexture2;
        }
        else
        {
            mUniforms.tSource.value = mTexture2;
            mRenderer.render(mScene, mCamera, mTexture1, true);
            mUniforms.tSource.value = mTexture1;
        }

        mToggled = !mToggled;
        mUniforms.brush.value = mMinusOnes;
    }

    if(mColorsNeedUpdate)
        updateUniformsColors();

    mScreenQuad.material = mScreenMaterial;
    mRenderer.render(mScene, mCamera);

    requestAnimationFrame(render);
}

loadPreset = function(idx)
{
    feed = presets[idx].feed;
    kill = presets[idx].kill;
    worldToForm();
}

var updateUniformsColors = function()
{
    var values = $("#gradient").gradient("getValuesRGBS");
    for(var i=0; i<values.length; i++)
    {
        var v = values[i];
        mColors[i].value = new THREE.Vector4(v[0], v[1], v[2], v[3]);
    }

    mColorsNeedUpdate = false;
}

var onUpdatedColor = function()
{
    mColorsNeedUpdate = true;
    updateShareString();
}

var onMouseMove = function(e)
{
    var ev = e ? e : window.event;

    mMouseX = ev.pageX - canvasQ.offset().left; // these offsets work with
    mMouseY = ev.pageY - canvasQ.offset().top; //  scrolled documents too

    if(mMouseDown)
        mUniforms.brush.value = new THREE.Vector2(mMouseX/canvasWidth, 1-mMouseY/canvasHeight);
}

var onMouseDown = function(e)
{
    var ev = e ? e : window.event;
    mMouseDown = true;

    mUniforms.brush.value = new THREE.Vector2(mMouseX/canvasWidth, 1-mMouseY/canvasHeight);
}

var onMouseUp = function(e)
{
    mMouseDown = false;
}

clean = function()
{
    mUniforms.brush.value = new THREE.Vector2(-10, -10);
}

downloadURI = function(uri, name)
{
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
}

snapshot = function()
{
    var dataURL = canvas.toDataURL("image/png");
    downloadURI(dataURL, "grayscott.png");
}

// resize canvas to fullscreen, scroll to upper left
// corner and try to enable fullscreen mode and vice-versa
fullscreen = function() {

    var canv = $('#myCanvas');
    var elem = canv.get(0);

    if(isFullscreen())
    {
        // end fullscreen
        if (elem.cancelFullscreen) {
            elem.cancelFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
            document.webkitCancelFullScreen();
        }
    }

    if(!isFullscreen())
    {
        // save current dimensions as old
        window.oldCanvSize = {
            width : canv.width(),
            height: canv.height()
        };

        // adjust canvas to screen size
        resize(screen.width, screen.height);

        // scroll to upper left corner
        $('html, body').scrollTop(canv.offset().top);
        $('html, body').scrollLeft(canv.offset().left);

        // request fullscreen in different flavours
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen();
        }
    }
}


var isFullscreen = function()
{
    return document.mozFullScreenElement ||
        document.webkitCurrentFullScreenElement ||
        document.fullscreenElement;
}

$(document).bind('webkitfullscreenchange mozfullscreenchange fullscreenchange', function(ev) {
    // restore old canvas size
    if(!isFullscreen())
        resize(window.oldCanvSize.width, window.oldCanvSize.height);
});

var worldToForm = function()
{
    //document.ex.sldReplenishment.value = feed * 1000;
    $("#sld_replenishment").slider("value", feed);
    $("#sld_diminishment").slider("value", kill);
}

var init_controls = function()
{//#######################################Very very very lazy implementation of adjusting diffusivity constants.

    $("#sld_replenishment").slider({
        value: feed, min: 0, max:0.1, step:0.001,
        change: function(event, ui) {$("#replenishment").html(ui.value); feed = ui.value; updateShareString();},
        slide: function(event, ui) {$("#replenishment").html(ui.value); feed = ui.value; updateShareString();}
    });
    $("#sld_replenishment").slider("value", feed);
    $("#sld_diminishment").slider({
        value: kill, min: 0, max:0.073, step:0.001,
        change: function(event, ui) {$("#diminishment").html(ui.value); kill = ui.value; updateShareString();},
        slide: function(event, ui) {$("#diminishment").html(ui.value); kill = ui.value; updateShareString();}
    });
    $("#sld_diminishment").slider("value", kill);

    //###############################################

    $('#share').keypress(function (e) {
        if (e.which == 13) {
            parseShareString();
            return false;
        }
    });

    $("#btn_clear").button({
        icons : {primary : "ui-icon-document"},
        text : false
    });
    $("#btn_snapshot").button({
        icons : {primary : "ui-icon-image"},
        text : false
    });
    $("#btn_fullscreen").button({
        icons : {primary : "ui-icon-arrow-4-diag"},
        text : false
    });

    $("#notworking").click(function(){
        $("#requirement_dialog").dialog("open");
    });
    $("#requirement_dialog").dialog({
        autoOpen: false
    });
}

alertInvalidShareString = function()
{
    $("#share").val("Invalid string!");
    setTimeout(updateShareString, 1000);
}

parseShareString = function()
{
    var str = $("#share").val();
    var fields = str.split(",");

    if(fields.length != 12)
    {
        alertInvalidShareString();
        return;
    }

    var newFeed = parseFloat(fields[0]);
    var newKill = parseFloat(fields[1]);

    if(isNaN(newFeed) || isNaN(newKill))
    {
        alertInvalidShareString();
        return;
    }

    var newValues = [];
    for(var i=0; i<5; i++)
    {
        var v = [parseFloat(fields[2+2*i]), fields[2+2*i+1]];

        if(isNaN(v[0]))
        {
            alertInvalidShareString();
            return;
        }

        // Check if the string is a valid color.
        if(! /^#[0-9A-F]{6}$/i.test(v[1]))
        {
            alertInvalidShareString();
            return;
        }

        newValues.push(v);
    }

    $("#gradient").gradient("setValues", newValues);
    feed = newFeed;
    kill = newKill;
    worldToForm();
}

updateShareString = function()
{
    var str = "".concat(feed, ",", kill);

    var values = $("#gradient").gradient("getValues");
    for(var i=0; i<values.length; i++)
    {
        var v = values[i];
        str += "".concat(",", v[0], ",", v[1]);
    }
    $("#share").val(str);
}

})();

////////////////////////NEW FUNCTIONS
///////////////////////////////////////////////////////////// The block to get button working
    
//Gets the users input from the box
function getVal(){
    const val = document.querySelector('input').value;
    return val;
}

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
var GSTR = GSTR1.replace(/y/g, 'uv.g')


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
    flag = true;
    if(flag = true){
        insertHTML(stringscript(),document.getElementById('gsFragmentShader'))
    }
    return flag;

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


