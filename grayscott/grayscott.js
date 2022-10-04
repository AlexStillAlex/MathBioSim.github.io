/*
 * Gray-Scott
 *
 * A solver of the Gray-Scott model of reaction diffusion.
 *
 * ©2012 pmneila.
 * p.mneila at upm.es
 */

// || Note: All comments made by me (Alex) will start and end with. ||
// || Example ||
(function(){

// Canvas.
var canvas;
var canvasQ;
var canvasWidth;
var canvasHeight;

var mMouseX, mMouseY;
var mMouseDown = false;


//||Rendering||
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

var DiffU;
var DiffV;


// Some presets.
var presets = [
    { // Default
        //DiffU: 0.018,
        //DiffV: 0.051
        DiffU: 0.2097,
        DiffV: 0.105,
        KA: 0.018,
        KB: 1.0,
        KC: 0.051,
    },
    { // Solitons
        // DiffU: 0.03,
        // DiffV: 0.062
        DiffU: 0.2097,
        DiffV: 0.105,
        KA: 0.03,
        KC: 0.062,
        KB: 1.0
    },
    { // Pulsating solitons
        // DiffU: 0.025,
        // DiffV: 0.06,
        DiffU: 0.2097,
        DiffV: 0.105,

        KA: 0.025,
        KC: 0.06,
        KB: 1.0
    },
    { // Worms.
        // DiffU: 0.078,
        // DiffV: 0.061
        DiffU: 0.2097,
        DiffV: 0.105,

        KA: 0.078,
        KC: 0.061,
        KB: 1.0

    },
    { // Mazes
        // DiffU: 0.029,
        // DiffV: 0.057
        DiffU: 0.2097,
        DiffV: 0.105,
        KA: 0.029,
        KB: 1.0,
        KC: 0.057
    },
    { // Holes
        // DiffU: 0.039,
        // DiffV: 0.058
        DiffU: 0.2097,
        DiffV: 0.105,
        KA: 0.039,
        KB : 1.0,
        KC: 0.058
    },
    { // Chaos
        // DiffU: 0.026,
        // DiffV: 0.051
        DiffU: 0.2097,
        DiffV: 0.105,
        KA: 0.026,
        KB: 1.0,
        KC: 0.051
    },
    { // Chaos and holes (by clem)
        // DiffU: 0.034,
        // DiffV: 0.056
        DiffU: 0.2097,
        DiffV: 0.105,
        KA: 0.034,
        KB: 1.0,
        KC: 0.056
    },
    { // Moving spots.
        // DiffU: 0.014,
        // DiffV: 0.054
        DiffU: 0.2097,
        DiffV: 0.105,

        KA: 0.014,
        KB: 1.0,
        KC: 0.056
        
    },
    { // Spots and loops.
        // DiffU: 0.018,
        // DiffV: 0.051
        DiffU: 0.2097,
        DiffV: 0.105,
        KA: 0.018,
        KB: 1.0,
        KC: 0.051
    },
    { // Waves
        // DiffU: 0.014,
        // DiffV: 0.045
        DiffU: 0.2097,
        DiffV: 0.105,

        KA: 0.014,
        KC: 0.045,
        KB: 1.0
    },
    { // The U-Skate World
        // DiffU: 0.062,
        // DiffV: 0.06093,
        DiffU: 0.2097,
        DiffV: 0.105,

        KA: 0.062,
        KB: 1.0,
        KC: 0.06093
    }
];




// Configuration.
var DiffU = presets[0].DiffU;
var DiffV = presets[0].DiffV;

var KA = presets[0].KA;
var KB = presets[0].KB;
var KC = presets[0].KC;


init = function() 

{//////////////////////////////////////////////////////////////////////////////////////////
    //This block generates the materials used for the canvas and the constants in the pde
    init_controls();

    canvasQ = $('#myCanvas');
    canvas = canvasQ.get(0);

    canvas.onmousedown = onMouseDown;
    canvas.onmouseup = onMouseUp;
    canvas.onmousemove = onMouseMove;

    mRenderer = new THREE.WebGLRenderer({canvas: canvas, preserveDrawingBuffer: true});

    mScene = new THREE.Scene();
    //Camera always appears a 'fixed' distance away from canvas
    mCamera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10000, 10000);
    mCamera.position.z = 100; 

    mScene.add(mCamera);

    //Contains the constants that communicates with the gsFragmentscript
    //this will be useful for the nondimensionalisation
    mUniforms = {
        screenWidth: {type: "f", value: undefined},
        screenHeight: {type: "f", value: undefined},
        tSource: {type: "t", value: undefined},
        delta: {type: "f", value: undefined},
        DiffU: {type: "f", value: DiffU},
        DiffV: {type: "f", value: DiffV},


        //These initialise the kinetic constants
        KA: {type: "f", value: KA},
        KB: {type: "f", value: KB},
        KC: {type: "f", value: KC},

        brush: {type: "v2", value: new THREE.Vector2(-10, -10)},
        // take a look at this
        color1: {type: "v4", value: new THREE.Vector4(0, 0, 0.0, 0)},
        color2: {type: "v4", value: new THREE.Vector4(0, 1, 0, 0.2)},
        color3: {type: "v4", value: new THREE.Vector4(1, 1, 0, 0.21)},
        color4: {type: "v4", value: new THREE.Vector4(1, 0, 0, 0.4)},
        color5: {type: "v4", value: new THREE.Vector4(1, 1, 1, 0.6)}
    };

    // ||mUniforms creates a list with colours. mColours takes this list and exclusively contains colours||
    mColors = [mUniforms.color1, mUniforms.color2, mUniforms.color3, mUniforms.color4, mUniforms.color5];
    $("#gradient").gradient("setUpdateCallback", onUpdatedColor);

    // Maybe need to change the fragment shader part to get what we want! 
    mGSMaterial = new THREE.ShaderMaterial({
            uniforms: mUniforms,

            vertexShader: document.getElementById('standardVertexShader').innerHTML,

            fragmentShader: document.getElementById('gsFragmentShader').innerHTML,
        });
    mScreenMaterial = new THREE.ShaderMaterial({
                uniforms: mUniforms,
                vertexShader: document.getElementById('standardVertexShader').textContent,
                fragmentShader: document.getElementById('screenFragmentShader').innerHTML,
            });

    var plane = new THREE.PlaneGeometry(1.0, 1.0);
    mScreenQuad = new THREE.Mesh(plane, mScreenMaterial);

    //after defining geometry,mesh and material we then add it to the scene
    mScene.add(mScreenQuad);

    mColorsNeedUpdate = true;


    resize(canvas.clientWidth, canvas.clientHeight);

    //THIS IS HOW THE INITIAL RENDER BEGINS
    render(0);

    console.log(`
        ⢀⡴⠑⡄⠀⠀⠀⠀⠀⠀⠀⣀⣀⣤⣤⣤⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀ 
        ⠸⡇⠀⠿⡀⠀⠀⠀⣀⡴⢿⣿⣿⣿⣿⣿⣿⣿⣷⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀ 
        ⠀⠀⠀⠀⠑⢄⣠⠾⠁⣀⣄⡈⠙⣿⣿⣿⣿⣿⣿⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀⠀ 
        ⠀⠀⠀⠀⢀⡀⠁⠀⠀⠈⠙⠛⠂⠈⣿⣿⣿⣿⣿⠿⡿⢿⣆⠀⠀⠀⠀⠀⠀⠀ 
        ⠀⠀⠀⢀⡾⣁⣀⠀⠴⠂⠙⣗⡀⠀⢻⣿⣿⠭⢤⣴⣦⣤⣹⠀⠀⠀⢀⢴⣶⣆ 
        ⠀⠀⢀⣾⣿⣿⣿⣷⣮⣽⣾⣿⣥⣴⣿⣿⡿⢂⠔⢚⡿⢿⣿⣦⣴⣾⠁⠸⣼⡿ 
        ⠀⢀⡞⠁⠙⠻⠿⠟⠉⠀⠛⢹⣿⣿⣿⣿⣿⣌⢤⣼⣿⣾⣿⡟⠉⠀⠀⠀⠀⠀ 
        ⠀⣾⣷⣶⠇⠀⠀⣤⣄⣀⡀⠈⠻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀ 
        ⠀⠉⠈⠉⠀⠀⢦⡈⢻⣿⣿⣿⣶⣶⣶⣶⣤⣽⡹⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀ 
        ⠀⠀⠀⠀⠀⠀⠀⠉⠲⣽⡻⢿⣿⣿⣿⣿⣿⣿⣷⣜⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀ 
        ⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣷⣶⣮⣭⣽⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀ 
        ⠀⠀⠀⠀⠀⠀⣀⣀⣈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠇⠀⠀⠀⠀⠀⠀⠀ 
        ⠀⠀⠀⠀⠀⠀⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀ 
        ⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀ 
        ⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠻⠿⠿⠿⠿⠛⠉
            Get out of my swamp`);
    //This is the initial 'spot location' in (x,y)
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
    //Depreciated code but allows for the vertical and horizontal wrapping                     
    mTexture1.wrapS = THREE.RepeatWrapping;
    mTexture1.wrapT = THREE.RepeatWrapping;
    mTexture2.wrapS = THREE.RepeatWrapping;
    mTexture2.wrapT = THREE.RepeatWrapping;

    mUniforms.screenWidth.value = canvasWidth/2;
    mUniforms.screenHeight.value = canvasHeight/2;
}
//////////////////////////////////////////////////////////////////////////////////////////////
//The Rendering block

var render = function(time)
{

    var dt = (time - mLastTime)/2;
 
    if(document.getElementById('alterself').onclick) //Check when GO! is pressed
        dt = document.getElementById('dt').value //Set the value of dt to the value in the box

    mLastTime = time;


    //##########################fragmentshaderupdate
    mGSMaterial.fragmentShader = document.getElementById('gsFragmentShader').innerHTML;
    mGSMaterial.needsUpdate = true;

    //#################################################
    mScreenQuad.material = mGSMaterial;
    //Important lines useful in changing the timestep/parameters in real time
    mUniforms.delta.value = dt;
    mUniforms.DiffU.value = DiffU;
    mUniforms.DiffV.value = DiffV;
    //This updates the kinetic constants according to the User input
    mUniforms.KA.value = document.getElementById('KineticA').value;
    mUniforms.KB.value = document.getElementById('KineticB').value;
    mUniforms.KC.value = document.getElementById('KineticC').value;

    //TRY CATCH IN THE RENDERING LOOP
try {
    

    for(var i=0; i<8; ++i)
    {
        //Two cases for when mouse is pressed or not.
 
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
 
    }

    //This is a little bit slow on reload.
    //Tells the user theres an error
    //Reloads the page.
    catch{
        alert('Howdy partner! Seems like you have typed in something the GPU did not like. Try again');
        //alert(functoshader(document.getElementById('F')),functoshader(document.getElementById('G')))
        //location.reload();

        return false;
    }
    
    if(mColorsNeedUpdate)
        updateUniformsColors();

    mScreenQuad.material = mScreenMaterial;
    //Rendering requires scene and camera/projection
    mRenderer.render(mScene, mCamera);
    requestAnimationFrame(render);
}


///////////////////////////////////////////////////////////////
//This block is responsible for most of the UI (namely the panel)
loadPreset = function(idx)
{
    DiffU = presets[idx].DiffU;
    DiffV = presets[idx].DiffV;
    KA = presets[idx].KA;
    KB = presets[idx].KB;
    KC = presets[idx].KC;
    worldToForm();
}

//Updates colours on canvas according to colour slider in the panel.
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
        mUniforms.brush.value = new THREE.Vector2(mMouseX/canvasWidth, 1-mMouseY/canvasHeight); //looks like normalised coordinates
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

//Alex here: Possibly a pointless feature - doesn't allow for wrapping.
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

//Updates the values of the sliders and stuff
var worldToForm = function()
{
    //document.ex.sldReplenishment.value = DiffU * 1000;
    $("#sld_replenishment").slider("value", DiffU);
    $("#sld_diminishment").slider("value", DiffV);

    document.getElementById('KineticA').value = KA;
    document.getElementById('KineticB').value = KB;
    document.getElementById('KineticC').value = KC;
    Change();
  
}


// Adjusts the sliders and such
var init_controls = function()
{//#######################################Very very very lazy implementation of adjusting diffusivity constants.

    $("#sld_replenishment").slider({
        value: DiffU, min: 0, max:10, step:0.01,
        change: function(event, ui) {$("#replenishment").html(ui.value); DiffU = ui.value; updateShareString();},
        slide: function(event, ui) {$("#replenishment").html(ui.value); DiffU = ui.value; updateShareString();}
    });
    $("#sld_replenishment").slider("value", DiffU);
    $("#sld_diminishment").slider({
        value: DiffV, min: 0, max:10, step:0.01,
        change: function(event, ui) {$("#diminishment").html(ui.value); DiffV = ui.value; updateShareString();},
        slide: function(event, ui) {$("#diminishment").html(ui.value); DiffV = ui.value; updateShareString();}
    });
    $("#sld_diminishment").slider("value", DiffV);

    //###############################################
    //Looks like some Jquery nonsense I don't know.
    //Gives a name to all the buttons - could change.
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

//Error handling for the share button at the buttom
alertInvalidShareString = function()
{
    $("#share").val("Invalid string!");
    setTimeout(updateShareString, 1000);
}
//Interprets the share string in links
parseShareString = function()
{
    var str = $("#share").val();
    var fields = str.split(",");

    if(fields.length != 12)
    {
        alertInvalidShareString();
        return;
    }

    var newDiffU = parseFloat(fields[0]);
    var newDiffV = parseFloat(fields[1]);

    if(isNaN(newDiffU) || isNaN(newDiffV))
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
//Find GRADIENT alex
    $("#gradient").gradient("setValues", newValues);
    DiffU = newDiffU;
    DiffV = newDiffV;
    worldToForm();
}

updateShareString = function()
{
    var str = "".concat(DiffU, ",", DiffV);

    var values = $("#gradient").gradient("getValues");
    for(var i=0; i<values.length; i++)
    {
        var v = values[i];
        str += "".concat(",", v[0], ",", v[1]);
    }
    $("#share").val(str);
}

})();



