class Panorama {

    static CONTROLS_NOTHING = 0;
    static CONTROLS_KEYBOARD = 1;
    static CONTROLS_MOUSE = 2;
    static CONTROLS_ALL = this.CONTROLS_MOUSE+this.CONTROLS_KEYBOARD;

    perspective = 0;
    scale = 0;
    distance = 0;

    yawAccelerationMultiplier = 0.005;
    pitchAccelerationMultiplier = 0.005;

    yawAcceleration = 0;
    pitchAcceleration = 0;

    yawMouseSens = 0.0025;
    pitchMouseSens = 0.0025;

    yaw = 0;
    pitch = 0;

    pitchUp = false;
    pitchDown = false;
    yawLeft = false;
    yawRight = false;

    panorama = null;
    panoramaFaces = [];
    panoramaPoints = [];

    constructor(panorama){
        this.panorama = panorama;
        this.setPerspective(panorama.dataset.panoramaPerspective||0.8);
    }

    setPerspective(perspective) {
        this.perspective = perspective;
        this.updateDistance();
        return this;
    }
    setControls(controls) {
        if(controls-Panorama.CONTROLS_MOUSE>-1) {
            controls-=Panorama.CONTROLS_MOUSE;
            this.panorama.addEventListener("click", this.clickHandler.bind(this));
            this.panorama.addEventListener("mousemove", this.mouseMoveHandler.bind(this));
        }
        if(controls-Panorama.CONTROLS_KEYBOARD>-1) {
            controls-=Panorama.CONTROLS_KEYBOARD;
            this.panorama.addEventListener("keydown", this.keyDownHandler.bind(this));
            this.panorama.addEventListener("keyup", this.keyUpHandler.bind(this));
        }
        return this;
    }
    setSize(size) {
        this.scale = size;
        this.updateDistance();
        return this;
    }
    updateDistance(){
        this.distance = this.scale/2-0.25/this.perspective;
    }

    configure() {
        this.configurePanorama();
        return this;
    }
    configurePanorama(){
        this.panorama.tabIndex = 0;
        this.panorama.style.position = "relative";
        this.panorama.style.overflow = "hidden";
        this.configurePanoramaFacesAndPoints();
    }
    configurePanoramaFacesAndPoints() {
        this.panoramaFaces = this.panorama.querySelectorAll("*[data-panorama-face]");
        for(let face of this.panoramaFaces) {
            face.style.position = "absolute";
            face.style.left = "50%";
            face.style.top = "50%";
            face.style.width = this.scale+"px";
            face.style.height = this.scale+"px";
        }
        this.panoramaPoints = this.panorama.querySelectorAll("*[data-panorama-point]");
        for(let point of this.panoramaPoints) {
            point.style.position = "absolute";
            point.style.left = "50%";
            point.style.top = "50%";
        }
    }
    clickHandler(event) {
        if(document.pointerLockElement!=this.panorama) {
            this.panorama.requestPointerLock();
        }
    }
    mouseMoveHandler(event) {
        if(document.pointerLockElement==this.panorama) {
            this.yaw-=event.movementX*this.yawMouseSens;
            this.pitch-=event.movementY*this.pitchMouseSens;
        }
    }
    keyDownHandler(event) {
        this.keyHandler(event.code, true);
    }
    keyUpHandler(event) {
        this.keyHandler(event.code, false);
    }
    keyHandler(key, isDown) {
        if(key=='KeyW'||key=='ArrowUp') this.pitchUp = isDown;
        if(key=='KeyS'||key=='ArrowDown') this.pitchDown = isDown;
        if(key=='KeyA'||key=='ArrowLeft') this.yawLeft = isDown;
        if(key=='KeyD'||key=='ArrowRight') this.yawRight = isDown;
    }
    update() {
        if(this.pitchUp) this.pitchAcceleration--;
        if(this.pitchDown) this.pitchAcceleration++;
        if(this.yawLeft) this.yawAcceleration--;
        if(this.yawRight) this.yawAcceleration++;
    
        this.pitch-= this.pitchAcceleration*this.pitchAccelerationMultiplier;
        this.yaw-= this.yawAcceleration*this.yawAccelerationMultiplier;
        
        this.pitch = Math.min(Math.PI/2, Math.max(-Math.PI/2, this.pitch));

        this.pitchAcceleration*=0.9;
        this.yawAcceleration*=0.9;
    }

    render() {
        for(let face of this.panoramaFaces) {
            let facePosition = face.dataset.panoramaFace;
            let rotateX = 0, rotateY = 0, rotateZ = 0;
            if(facePosition=="top") {
                rotateX = this.pitch+Math.PI/2;
                rotateZ = -this.yaw;
            } else if(facePosition=="bottom") {
                rotateX = this.pitch-Math.PI/2;
                rotateZ = this.yaw;
            } else if(facePosition=="front") {
                rotateX = this.pitch;
                rotateY = this.yaw;
            } else if(facePosition=="right") {
                rotateX = this.pitch;
                rotateY = this.yaw+Math.PI/2;
            } else if(facePosition=="back") {
                rotateX = this.pitch;
                rotateY = this.yaw+Math.PI;
            } else if(facePosition=="left") {
                rotateX = this.pitch;
                rotateY = this.yaw+Math.PI*1.5;
            }
    
            let transform = "translate(-50%, -50%) "
                          + "perspective("+this.perspective+"px) "
                          + "scale("+(-this.scale)+", "+this.scale+") "
                          + "rotateX("+rotateX+"rad) "
                          + "rotateY("+rotateY+"rad) "
                          + "rotateZ("+rotateZ+"rad) "
                          + "translateZ("+this.distance+"px)";
            face.style.transform = transform;
        }

        for(let point of this.panoramaPoints) {
            let x = point.dataset.panoramaX;
            let y = point.dataset.panoramaY;
            let z = point.dataset.panoramaZ;
            let side = point.dataset.panoramaSide;
            let scale = point.dataset.panoramaScale;
            let orientation = point.dataset.panoramaOrientation;
            
            let rotateX = -this.pitch + parseInt(point.dataset.panoramaRotateX||0);
            let rotateY = this.yaw + parseInt(point.dataset.panoramaRotateY||0);
            let rotateZ = 0 + parseInt(point.dataset.panoramaRotateZ||0);

            if(side=="top") {
                rotateX+= Math.PI/2;
                rotateY = 0;
                rotateZ-= this.yaw;
            } else if(side=="bottom") {
                rotateX-= Math.PI/2;
                rotateY = 0;
                rotateZ+= this.yaw;
            } else if(side=="front") {
                rotateY+= 0;
            } else if(side=="right") {
                rotateY+= Math.PI/2;
            } else if(side=="back") {
                rotateY+= Math.PI;
            } else if(side=="left") {
                rotateY-= Math.PI/2;
            }

            if(orientation=="screen") {
                rotateZ = 0;
            }

            let transform = "translate(-50%, -50%)"
                          + "perspective("+this.perspective+"px) "
                          + "scale("+-z+")"
                          + "rotateX("+rotateX+"rad) "
                          + "rotateY("+rotateY+"rad) "
                          + "rotateZ("+rotateZ+"rad) "
                          + "translateX("+-x+"px) "
                          + "translateY("+-y+"px) "
                          + "translateZ("+-z+"px) "
                          + "rotateZ("+Math.PI+"rad) "
                          //+ "rotateY(45deg)"
                          + "scale("+scale+")";
            point.style.transform = transform;
        }

    }
    _loop(){
        this.update();
        this.render();
        window.requestAnimationFrame(this._loop.bind(this));
    }
    start() {
        this._loop();
    }
}
