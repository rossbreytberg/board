window.onload = function() {
    var imageBoard = document.getElementById("imageBoard"),
        helpTip = document.getElementById("helpTip"),
        imageFileReader = new FileReader(),
        socket = io.connect(),
        expandedImage = null,
        showingHelpTip = true,
        pageX = 0,
        pageY = 0,
        THUMBNAIL_SIZE = 300,
        THUMBNAIL_BORDER_WIDTH = 5,
        THUMBNAIL_SHADOW_SIZE = 2,
        THUMBNAIL_SHADOW_BLUR = 2,
        THUMBNAIL_SHADOW_COLOR = "rgba(0, 0, 0, 0.5)",
        POSTIMAGE_ANIMATION_DURATION = "500ms",
        POSTIMAGE_ANIMATION_TIMING_FUNCTION = "ease-in-out",
        EXPAND_ANIMATION_DURATION = "500ms",
        EXPAND_ANIMATION_TIMING_FUNCTION = "ease-in",
        EXPAND_SIZE_MULTIPLIER = 0.95,
        HELPTIP_FADE_ANIMATION_DURATION = "3s",
        HELPTIP_FADE_ANIMATION_TIMING_FUNCTION = "ease";

    var onDragOver = function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = "copy";
    };

    var onDrop = function(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        var files = evt.dataTransfer.files;
        var file = files[0];
        pageX = evt.pageX - this.offsetLeft;
        pageY = evt.pageY - this.offsetTop;
        var src = window.webkitURL.createObjectURL(file);
        postImage(pageX, pageY, src, true);
        imageFileReader.readAsBinaryString(file);
    };

    var onDragAndDropOutOfBounds = function(evt) {
        evt.preventDefault();
    };

    var animation = function(element, properties, startValues, endValues, duration, timingFunction, callback) {
        if (timingFunction == null) {
            timingFunction = "";
        }
        var tempClassName = "newClass" + String(new Date().getTime());
        var tempAnimationName = "newAnimation"  + String(new Date().getTime());
        var styleRules = "." + tempClassName + " { -webkit-animation: " + tempAnimationName + " " + duration + " " + timingFunction +"; } ";
        styleRules += "@-webkit-keyframes " + tempAnimationName + " { from { ";
        for (i in properties) {
            var property = properties[i];
            var startValue = startValues[i];
            styleRules += property + ": " + String(startValue) + "; ";
        } 
        styleRules += " } to { ";
        for (i in properties) {
            var property = properties[i];
            var endValue = endValues[i];
            styleRules += property + ": " + String(endValue) + "; ";
        }
        styleRules += "} }";
        var styleParent = document.head;
        var styleElement = document.createElement("style");
        styleElement.type = "text/css";
        var styleTextNode = document.createTextNode(styleRules);
        styleElement.appendChild(styleTextNode);
        styleParent.appendChild(styleElement);
        var onAnimationEnd = function(evt) {
            element.removeEventListener("webkitAnimationEnd", onAnimationEnd);
            element.classList.remove(tempClassName);
            styleParent.removeChild(styleElement);
            if (callback != null) {
                callback();
            }
        };
        element.addEventListener("webkitAnimationEnd", onAnimationEnd);
        element.classList.add(tempClassName);
    };

    var getScaledDimensions = function(naturalWidth, naturalHeight, targetWidth, targetHeight) {
        var aspectRatio = naturalWidth/naturalHeight;
        var desiredWidth = targetWidth;
        var desiredHeight = targetWidth/aspectRatio;
        if (desiredWidth > targetWidth || desiredHeight > targetHeight) {
            desiredWidth = targetHeight * aspectRatio;
            desiredHeight = targetHeight;
        }
        if (desiredWidth > naturalWidth && desiredHeight > naturalHeight) {
            desiredWidth = naturalWidth;
            desiredHeight = naturalHeight;
        }
        return {"width": desiredWidth, "height": desiredHeight};
    }

    var expandImage = function(image) {
        if (expandedImage != null && expandedImage != image) {
            expandedImage.onclick();
        }
        expandedImage = image;
        var documentElement = document.documentElement;
        var pageWidth = documentElement.clientWidth;
        var pageHeight = documentElement.clientHeight;
        var imageStyle = image.style;
        var initialWidth = parseInt(image.offsetWidth);
        var initialHeight = parseInt(image.offsetHeight);
        var initialLeft = parseInt(imageStyle.left);
        var initialTop = parseInt(imageStyle.top);
        var initialTransform = imageStyle.webkitTransform;
        var targetDimensions = getScaledDimensions(initialWidth, initialHeight, pageWidth * EXPAND_SIZE_MULTIPLIER, pageHeight * EXPAND_SIZE_MULTIPLIER);
        var targetWidth = targetDimensions.width;
        var targetHeight = targetDimensions.height;
        var targetLeft = pageWidth/2 - imageBoard.offsetLeft - initialWidth/2;
        var targetTop = pageHeight/2 - imageBoard.offsetTop - initialHeight/2;
        var targetTransform = "translate3d(" + (targetLeft - initialLeft) + "px, " + (targetTop - initialTop) + "px, 0px) scale(" + targetWidth/initialWidth + ")";
        image.onclick = null;
        imageStyle.zIndex = 2;
        imageStyle.webkitTransform = targetTransform;
        animation(image, ["-webkit-transform"], [initialTransform], [targetTransform], EXPAND_ANIMATION_DURATION, EXPAND_ANIMATION_TIMING_FUNCTION, function() {
            imageStyle.zIndex = 1;
            image.onclick = function() {
                expandedImage = null;
                image.onclick = null;
                imageStyle.webkitTransform = initialTransform;
                animation(image, ["-webkit-transform"], [targetTransform,], [initialTransform], EXPAND_ANIMATION_DURATION, EXPAND_ANIMATION_TIMING_FUNCTION, function() {
                    imageStyle.zIndex = 0;
                    image.onclick = function() {
                        expandImage(image);
                    }
                });
            };
        });
    };

    var postImage = function(x, y, src) {
        var image = new Image();
        image.src = src;
        image.className = "img";
        image.onload = function() {
            var naturalWidth = image.naturalWidth;
            var naturalHeight = image.naturalHeight;
            var initialDimensions = getScaledDimensions(naturalWidth, naturalHeight, 1, 1);
            var thumbnailDimensions = getScaledDimensions(naturalWidth, naturalHeight, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
            var thumbnailScale = thumbnailDimensions.width/naturalWidth;
            var thumbnailScaleString = "scale(" + thumbnailScale + ")";
            var duration;
            var imageStyle = image.style;
            imageStyle.width = naturalWidth;
            imageStyle.height = naturalHeight;
            imageStyle.left = x - naturalWidth/2;
            imageStyle.top = y - naturalHeight/2;
            imageStyle.borderWidth = THUMBNAIL_BORDER_WIDTH * 1/thumbnailScale;
            var shadowSize = THUMBNAIL_SHADOW_SIZE * 1/thumbnailScale;
            var shadowBlur = THUMBNAIL_SHADOW_BLUR * 1/thumbnailScale;
            imageStyle.boxShadow = shadowSize + "px " + shadowSize + "px " + shadowBlur + "px " + THUMBNAIL_SHADOW_COLOR;
            imageStyle.webkitTransform = thumbnailScaleString;
            imageBoard.appendChild(image);
            animation(image, ["-webkit-transform"], ["scale(0)"], [thumbnailScaleString], POSTIMAGE_ANIMATION_DURATION, POSTIMAGE_ANIMATION_TIMING_FUNCTION);
            image.onclick = function() {
                expandImage(image);
            };
        };
        if (showingHelpTip) {
            showingHelpTip = false;
            helpTip.style.opacity = 0;
            animation(helpTip, ["opacity"], [1], [0], HELPTIP_FADE_ANIMATION_DURATION, HELPTIP_FADE_ANIMATION_TIMING_FUNCTION, function() {
                helpTip.style.visibility = "hidden";
            });
        }
    };

    imageFileReader.onload = function(evt) {
        socket.emit("postImage", {"x": pageX, "y": pageY, "binary": evt.target.result});
    };

    document.addEventListener("dragover", onDragAndDropOutOfBounds, false);
    document.addEventListener("drop", onDragAndDropOutOfBounds, false);
    imageBoard.addEventListener("dragover", onDragOver, false);
    imageBoard.addEventListener("drop", onDrop, false);

    socket.on("postImage", function(data) {
        var x = data.x;
        var y = data.y;
        var binary = data.binary;
        var base64 = btoa(binary);
        postImage(x, y, "data:image/*;base64,"+base64);
    });

};