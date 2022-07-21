var ODFViewerPlugin_css = "@namespace cursor url(urn:webodf:names:cursor);.caret {opacity: 0 !important;}";

function ODFViewerPlugin() {
    function b(b) {
        var a = document.createElement("script");
        a.async = !1;
        a.src = "/static/viewerjs/webodf.js";
        a.type = "text/javascript";
        a.onload = function() {
            runtime.loadClass("gui.HyperlinkClickHandler");
            runtime.loadClass("odf.OdfCanvas");
            runtime.loadClass("ops.Session");
            runtime.loadClass("gui.CaretManager");
            runtime.loadClass("gui.HyperlinkTooltipView");
            runtime.loadClass("gui.SessionController");
            runtime.loadClass("gui.SvgSelectionView");
            runtime.loadClass("gui.SelectionViewManager");
            runtime.loadClass("gui.ShadowCursor");
            runtime.loadClass("gui.SessionView");
            b()
        };
        document.head.appendChild(a);
        a = document.createElementNS(document.head.namespaceURI, "style");
        a.setAttribute("media", "screen, print, handheld, projection");
        a.setAttribute("type", "text/css");
        a.appendChild(document.createTextNode(ODFViewerPlugin_css));
        document.head.appendChild(a)
    }
    var r = this,
        f = null,
        x = null,
        s = null,
        k = null;
    this.initialize = function(q, a) {
        b(function() {
            var e, c, b, q, l, z, u, v;
            x = document.getElementById("canvas");
            f = new odf.OdfCanvas(x);
            f.load(a);
            f.addListener("statereadychange",
                function() {
                    s = f.odfContainer().rootElement;
                    k = f.odfContainer().getDocumentType(s);
                    if ("text" === k) {
                        f.enableAnnotations(!0, !1);
                        e = new ops.Session(f);
                        b = e.getOdtDocument();
                        q = new gui.ShadowCursor(b);
                        c = new gui.SessionController(e, "localuser", q, {});
                        v = c.getEventManager();
                        z = new gui.CaretManager(c, f.getViewport());
                        l = new gui.SelectionViewManager(gui.SvgSelectionView);
                        new gui.SessionView({
                            caretAvatarsInitiallyVisible: !1
                        }, "localuser", e, c.getSessionConstraints(), z, l);
                        l.registerCursor(q);
                        u = new gui.HyperlinkTooltipView(f,
                            c.getHyperlinkClickHandler().getModifier);
                        v.subscribe("mousemove", u.showTooltip);
                        v.subscribe("mouseout", u.hideTooltip);
                        var a = new ops.OpAddMember;
                        a.init({
                            memberid: "localuser",
                            setProperties: {
                                fillName: runtime.tr("Unknown Author"),
                                color: "blue"
                            }
                        });
                        e.enqueue([a]);
                        c.insertLocalCursor()
                    }
                    r.onLoad()
                })
        })
    };
    this.isSlideshow = function() {
        return "presentation" === k
    };
    this.onLoad = function() {};
    this.fitToWidth = function(b) {
        f.fitToWidth(b)
    };
    this.fitToHeight = function(b) {
        f.fitToHeight(b)
    };
    this.fitToPage = function(b, a) {
        f.fitToContainingElement(b,
            a)
    };
    this.fitSmart = function(b) {
        f.fitSmart(b)
    };
    this.getZoomLevel = function() {
        return f.getZoomLevel()
    };
    this.setZoomLevel = function(b) {
        f.setZoomLevel(b)
    };
    this.getPages = function() {
        var b = Array.prototype.slice.call(s.getElementsByTagNameNS("urn:oasis:names:tc:opendocument:xmlns:drawing:1.0", "page")),
            a = [],
            e, c;
        for (e = 0; e < b.length; e += 1) c = [b[e].getAttribute("draw:name"), b[e]], a.push(c);
        return a
    };
    this.showPage = function(b) {
        f.showPage(b)
    };
    this.getPluginName = function() {
        return "WebODF"
    };
    this.getPluginVersion = function() {
        return "undefined" !==
            String(typeof webodf) ? webodf.Version : "Unknown"
    };
    this.getPluginURL = function() {
        return "http://webodf.org"
    }
};
var PDFViewerPlugin_css = ".page {margin: 7px auto 7px auto;position: relative;overflow: hidden;background-clip: content-box;background-color: white;box-shadow:         0px 0px 7px rgba(0, 0, 0, 0.75);-webkit-box-shadow: 0px 0px 7px rgba(0, 0, 0, 0.75);-moz-box-shadow:    0px 0px 7px rgba(0, 0, 0, 0.75);-ms-box-shadow:    0px 0px 7px rgba(0, 0, 0, 0.75);-o-box-shadow:    0px 0px 7px rgba(0, 0, 0, 0.75);}.textLayer {position: absolute;left: 0;top: 0;right: 0;bottom: 0;color: #000;font-family: sans-serif;overflow: hidden;}.textLayer > div {color: transparent;position: absolute;line-height: 1;white-space: pre;cursor: text;}::selection { background:rgba(0,0,255,0.3); }::-moz-selection { background:rgba(0,0,255,0.3); }";

function PDFViewerPlugin() {
    function b(d, a) {
        var b = document.createElement("script");
        b.async = !1;
        b.src = d;
        b.type = "text/javascript";
        b.onload = a || b.onload;
        document.getElementsByTagName("head")[0].appendChild(b)
    }

    function r(d) {
        var a;
        b("/static/viewerjs/compatibility.js", function() {
            b("/static/viewerjs/pdf.js");
            b("/static/viewerjs/ui_utils.js");
            b("/static/viewerjs/text_layer_builder.js");
            b("/static/viewerjs/pdfjsversion.js", d)
        });
        a = document.createElementNS(document.head.namespaceURI, "style");
        a.setAttribute("media", "screen, print, handheld, projection");
        a.setAttribute("type", "text/css");
        a.appendChild(document.createTextNode(PDFViewerPlugin_css));
        document.head.appendChild(a)
    }

    function f(d) {
        if ("none" === d.style.display) return !1;
        var a = u.scrollTop,
            b = a + u.clientHeight,
            c = d.offsetTop;
        d = c + d.clientHeight;
        return c >= a && c < b || d >= a && d < b || c < a && d >= b
    }

    function x(d, a, b) {
        var e = c[d.pageIndex],
            f = e.getElementsByTagName("canvas")[0],
            h = e.getElementsByTagName("div")[0],
            k = "scale(" + g + ", " + g + ")";
        e.style.width = a + "px";
        e.style.height = b + "px";
        f.width = a;
        f.height = b;
        h.style.width = a + "px";
        h.style.height = b + "px";
        CustomStyle.setProp("transform",
            h, k);
        CustomStyle.setProp("transformOrigin", h, "0% 0%");
        t[d.pageIndex] = t[d.pageIndex] === l.RUNNING ? l.RUNNINGOUTDATED : l.BLANK
    }

    function s(d) {
        var a, b;
        t[d.pageIndex] === l.BLANK && (t[d.pageIndex] = l.RUNNING, a = c[d.pageIndex], b = B[d.pageIndex], a = a.getElementsByTagName("canvas")[0], d.render({
            canvasContext: a.getContext("2d"),
            textLayer: b,
            viewport: d.getViewport(g)
        }).promise.then(function() {
            t[d.pageIndex] === l.RUNNINGOUTDATED ? (t[d.pageIndex] = l.BLANK, s(d)) : t[d.pageIndex] = l.FINISHED
        }))
    }

    function k() {
        var d = !a.isSlideshow();
        c.forEach(function(a) {
            d && (a.style.display = "block");
            u.appendChild(a)
        });
        a.showPage(1);
        a.onLoad()
    }

    function q(d) {
        var a, b, f, m, h, n;
        a = d.pageIndex + 1;
        n = d.getViewport(g);
        h = document.createElement("div");
        h.id = "pageContainer" + a;
        h.className = "page";
        h.style.display = "none";
        m = document.createElement("canvas");
        m.id = "canvas" + a;
        b = document.createElement("div");
        b.className = "textLayer";
        b.id = "textLayer" + a;
        h.appendChild(m);
        h.appendChild(b);
        e[d.pageIndex] = d;
        c[d.pageIndex] = h;
        t[d.pageIndex] = l.BLANK;
        x(d, n.width, n.height);
        y < n.width &&
            (y = n.width);
        w < n.height && (w = n.height);
        n.width < n.height && (p = !1);
        f = new TextLayerBuilder({
            textLayerDiv: b,
            viewport: n,
            pageIndex: a - 1
        });
        d.getTextContent().then(function(a) {
            f.setTextContent(a);
            f.render(z)
        });
        B[d.pageIndex] = f;
        E += 1;
        E === v.numPages && k()
    }
    var a = this,
        e = [],
        c = [],
        B = [],
        t = [],
        l = {
            BLANK: 0,
            RUNNING: 1,
            FINISHED: 2,
            RUNNINGOUTDATED: 3
        },
        z = 200,
        u = null,
        v = null,
        p = !0,
        g = 1,
        A = 1,
        y = 0,
        w = 0,
        E = 0;
    this.initialize = function(a, b) {
        var c;
        r(function() {
            PDFJS.workerSrc = "/static/viewerjs/pdf.worker.js";
            PDFJS.getDocument(b).then(function(b) {
                v = b;
                u = a;
                for (c =
                    0; c < v.numPages; c += 1) v.getPage(c + 1).then(q)
            })
        })
    };
    this.isSlideshow = function() {
        return p
    };
    this.onLoad = function() {};
    this.getPages = function() {
        return c
    };
    this.fitToWidth = function(d) {
        y !== d && (d /= y, a.setZoomLevel(d))
    };
    this.fitToHeight = function(d) {
        w !== d && (d /= w, a.setZoomLevel(d))
    };
    this.fitToPage = function(d, b) {
        var c = d / y;
        b / w < c && (c = b / w);
        a.setZoomLevel(c)
    };
    this.fitSmart = function(d, b) {
        var c = d / y;
        b && b / w < c && (c = b / w);
        c = Math.min(1, c);
        a.setZoomLevel(c)
    };
    this.setZoomLevel = function(a) {
        var b;
        if (g !== a)
            for (g = a, a = 0; a < e.length; a +=
                1) b = e[a].getViewport(g), x(e[a], b.width, b.height)
    };
    this.getZoomLevel = function() {
        return g
    };
    this.onScroll = function() {
        var a;
        for (a = 0; a < c.length; a += 1) f(c[a]) && s(e[a])
    };
    this.getPageInView = function() {
        var b;
        if (a.isSlideshow()) return A;
        for (b = 0; b < c.length; b += 1)
            if (f(c[b])) return b + 1
    };
    this.showPage = function(b) {
        a.isSlideshow() ? (c[A - 1].style.display = "none", A = b, s(e[b - 1]), c[b - 1].style.display = "block") : (b = c[b - 1], b.parentNode.scrollTop = b.offsetTop)
    };
    this.getPluginName = function() {
        return "PDF.js"
    };
    this.getPluginVersion =
        function() {
            return "undefined" !== String(typeof pdfjs_version) ? pdfjs_version : "From Source"
        };
    this.getPluginURL = function() {
        return "https://github.com/mozilla/pdf.js/"
    }
};
var ViewerJS_version = "0.5.9";
var viewer_css = "";
var viewerTouch_css = "";
var viewer_css = "";
var viewerTouch_css = "";

function Viewer(b, r) {
    function f() {
        var a, c, d, e, g, f;
        f = "undefined" !== String(typeof ViewerJS_version) ? ViewerJS_version : "From Source";
        b && (d = b.getPluginName(), e = b.getPluginVersion(), g = b.getPluginURL());
        a = document.createElement("div");
        a.id = "aboutDialogCentererTable";
        c = document.createElement("div");
        c.id = "aboutDialogCentererCell";
        I = document.createElement("div");
        I.id = "aboutDialog";
        I.innerHTML = '<h1>ViewerJS</h1><p>Open Source document viewer for webpages, built with HTML and JavaScript.</p><p>Learn more and get your own copy on the <a href="http://viewerjs.org/" target="_blank">ViewerJS website</a>.</p>' +
            (b ? '<p>Using the <a href = "' + g + '" target="_blank">' + d + '</a> (<span id = "pluginVersion">' + e + "</span>) plugin to show you this document.</p>" : "") + "<p>Version " + f + '</p><p>Supported by <a href="https://nlnet.nl" target="_blank"><br><img src="/static/viewerjs/images/nlnet.png" width="160" height="60" alt="NLnet Foundation"></a></p><p>Made by <a href="http://kogmbh.com" target="_blank"><br><img src="/static/viewerjs/images/kogmbh.png" width="172" height="40" alt="KO GmbH"></a></p><button id = "aboutDialogCloseButton" class = "toolbarButton textButton">Close</button>';
        K.appendChild(a);
        a.appendChild(c);
        c.appendChild(I);
        a = document.createElement("button");
        a.id = "about";
        a.className = "toolbarButton textButton about";
        a.title = "About";
        a.innerHTML = "ViewerJS";
        Q.appendChild(a);
        a.addEventListener("click", function() {
            K.style.display = "block"
        });
        document.getElementById("aboutDialogCloseButton").addEventListener("click", function() {
            K.style.display = "none"
        })
    }

    function x(a) {
        var b = R.options,
            c, d = !1,
            e;
        for (e = 0; e < b.length; e += 1) c = b[e], c.value !== a ? c.selected = !1 : d = c.selected = !0;
        return d
    }

    function s(a,
        b) {
        if (a !== g.getZoomLevel()) {
            g.setZoomLevel(a);
            var c = document.createEvent("UIEvents");
            c.initUIEvent("scalechange", !1, !1, window, 0);
            c.scale = a;
            c.resetAutoSettings = b;
            window.dispatchEvent(c)
        }
    }

    function k() {
        var a;
        if (b.onScroll) b.onScroll();
        b.getPageInView && (a = b.getPageInView()) && (F = a, document.getElementById("pageNumber").value = a)
    }

    function q(a) {
        window.clearTimeout(M);
        M = window.setTimeout(function() {
            k()
        }, a)
    }

    function a(a, c) {
        var d, e;
        if (d = "custom" === a ? parseFloat(document.getElementById("customScaleOption").textContent) /
            100 : parseFloat(a)) s(d, !0);
        else {
            d = h.clientWidth - A;
            e = h.clientHeight - A;
            switch (a) {
                case "page-actual":
                    s(1, c);
                    break;
                case "page-width":
                    b.fitToWidth(d);
                    break;
                case "page-height":
                    b.fitToHeight(e);
                    break;
                case "page-fit":
                    b.fitToPage(d, e);
                    break;
                case "auto":
                    b.isSlideshow() ? b.fitToPage(d + A, e + A) : b.fitSmart(d)
            }
            x(a)
        }
        q(300)
    }

    function e(a) {
        var b;
        return -1 !== ["auto", "page-actual", "page-width"].indexOf(a) ? a : (b = parseFloat(a)) && y <= b && b <= w ? a : E
    }

    function c(a) {
        a = parseInt(a, 10);
        return isNaN(a) ? 1 : a
    }

    function B() {
        D = !D;
        d && !D && g.togglePresentationMode()
    }

    function t() {
        if (d || b.isSlideshow()) n.className = "viewer-touched", window.clearTimeout(N), N = window.setTimeout(function() {
            n.className = ""
        }, 5E3)
    }

    function l() {
        C.classList.add("viewer-touched");
        G.classList.add("viewer-touched");
        window.clearTimeout(O);
        O = window.setTimeout(function() {
            z()
        }, 5E3)
    }

    function z() {
        C.classList.remove("viewer-touched");
        G.classList.remove("viewer-touched")
    }

    function u() {
        C.classList.contains("viewer-touched") ? z() : l()
    }

    function v(a) {
        blanked.style.display = "block";
        blanked.style.backgroundColor =
            a;
        z()
    }

    function p(a, b) {
        var c = document.getElementById(a);
        c.addEventListener("click", function() {
            b();
            c.blur()
        })
    }
    var g = this,
        A = 40,
        y = 0.25,
        w = 4,
        E = "auto",
        d = !1,
        D = !1,
        L = !1,
        J, m = document.getElementById("viewer"),
        h = document.getElementById("canvasContainer"),
        n = document.getElementById("overlayNavigator"),
        C = document.getElementById("titlebar"),
        G = document.getElementById("toolbarContainer"),
        P = document.getElementById("toolbarLeft"),
        S = document.getElementById("toolbarMiddleContainer"),
        R = document.getElementById("scaleSelect"),
        K = document.getElementById("dialogOverlay"),
        Q = document.getElementById("toolbarRight"),
        I, H = [],
        F, M, N, O;
    this.initialize = function() {
        var d;
        d = e(r.zoom);
        J = r.documentUrl;
        document.title = r.title;
        var f = document.getElementById("documentName");
        f.innerHTML = "";
        f.appendChild(f.ownerDocument.createTextNode(''));
        b.onLoad = function() {
            document.getElementById("pluginVersion").innerHTML = b.getPluginVersion();
            b.isSlideshow() ? (h.classList.add("slideshow"), P.style.visibility = "visible") : (S.style.visibility = "visible", b.getPageInView &&
                (P.style.visibility = "visible"));
            L = !0;
            H = b.getPages();
            document.getElementById("numPages").innerHTML = "of " + H.length;
            g.showPage(c(r.startpage));
            a(d);
            h.onscroll = k;
            q()
        };
        b.initialize(h, J)
    };
    this.showPage = function(a) {
        0 >= a ? a = 1 : a > H.length && (a = H.length);
        b.showPage(a);
        F = a;
        document.getElementById("pageNumber").value = F
    };
    this.showNextPage = function() {
        g.showPage(F + 1)
    };
    this.showPreviousPage = function() {
        g.showPage(F - 1)
    };
    this.download = function() {
        var a = J.split("#")[0];
        window.open(a + "#viewer.action=download", "_parent")
    };
    this.toggleFullScreen = function() {
        D ? document.exitFullscreen ? document.exitFullscreen() : document.cancelFullScreen ? document.cancelFullScreen() : document.mozCancelFullScreen ? document.mozCancelFullScreen() : document.webkitExitFullscreen ? document.webkitExitFullscreen() : document.webkitCancelFullScreen ? document.webkitCancelFullScreen() : document.msExitFullscreen && document.msExitFullscreen() : m.requestFullscreen ? m.requestFullscreen() : m.mozRequestFullScreen ? m.mozRequestFullScreen() : m.webkitRequestFullscreen ? m.webkitRequestFullscreen() :
            m.webkitRequestFullScreen ? m.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT) : m.msRequestFullscreen && m.msRequestFullscreen()
    };
    this.togglePresentationMode = function() {
        var b = document.getElementById("overlayCloseButton");
        d ? ("block" === blanked.style.display && (blanked.style.display = "none", u()), C.style.display = G.style.display = "block", b.style.display = "none", h.classList.remove("presentationMode"), h.onmouseup = function() {}, h.oncontextmenu = function() {}, h.onmousedown = function() {}, a("auto")) : (C.style.display =
            G.style.display = "none", b.style.display = "block", h.classList.add("presentationMode"), h.onmousedown = function(a) {
                a.preventDefault()
            }, h.oncontextmenu = function(a) {
                a.preventDefault()
            }, h.onmouseup = function(a) {
                a.preventDefault();
                1 === a.which ? g.showNextPage() : g.showPreviousPage()
            }, a("page-fit"));
        d = !d
    };
    this.getZoomLevel = function() {
        return b.getZoomLevel()
    };
    this.setZoomLevel = function(a) {
        b.setZoomLevel(a)
    };
    this.zoomOut = function() {
        var b = (g.getZoomLevel() / 1.1).toFixed(2),
            b = Math.max(y, b);
        a(b, !0)
    };
    this.zoomIn = function() {
        var b =
            (1.1 * g.getZoomLevel()).toFixed(2),
            b = Math.min(w, b);
        a(b, !0)
    };
    (function() {
        f();
        b && (g.initialize(), document.exitFullscreen || document.cancelFullScreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.webkitCancelFullScreen || document.msExitFullscreen || (document.getElementById("fullscreen").style.visibility = "hidden", document.getElementById("presentation").style.visibility = "hidden"), p("overlayCloseButton", g.toggleFullScreen), p("fullscreen", g.toggleFullScreen), p("presentation", function() {
            D ||
                g.toggleFullScreen();
            g.togglePresentationMode()
        }), document.addEventListener("fullscreenchange", B), document.addEventListener("webkitfullscreenchange", B), document.addEventListener("mozfullscreenchange", B), document.addEventListener("MSFullscreenChange", B), p("download", g.download), p("zoomOut", g.zoomOut), p("zoomIn", g.zoomIn), p("previous", g.showPreviousPage), p("next", g.showNextPage), p("previousPage", g.showPreviousPage), p("nextPage", g.showNextPage), document.getElementById("pageNumber").addEventListener("change",
            function() {
                g.showPage(this.value)
            }), document.getElementById("scaleSelect").addEventListener("change", function() {
            a(this.value)
        }), h.addEventListener("click", t), n.addEventListener("click", t), h.addEventListener("click", u), C.addEventListener("click", l), G.addEventListener("click", l), window.addEventListener("scalechange", function(a) {
            var b = document.getElementById("customScaleOption"),
                c = x(String(a.scale));
            b.selected = !1;
            c || (b.textContent = Math.round(1E4 * a.scale) / 100 + "%", b.selected = !0)
        }, !0), window.addEventListener("resize",
            function(b) {
                L && (document.getElementById("pageWidthOption").selected || document.getElementById("pageAutoOption").selected) && a(document.getElementById("scaleSelect").value);
                t()
            }), window.addEventListener("keydown", function(a) {
            var b = a.keyCode;
            a = a.shiftKey;
            if ("block" === blanked.style.display) switch (b) {
                case 16:
                case 17:
                case 18:
                case 91:
                case 93:
                case 224:
                case 225:
                    break;
                default:
                    blanked.style.display = "none", u()
            } else switch (b) {
                case 8:
                case 33:
                case 37:
                case 38:
                case 80:
                    g.showPreviousPage();
                    break;
                case 13:
                case 34:
                case 39:
                case 40:
                case 78:
                    g.showNextPage();
                    break;
                case 32:
                    a ? g.showPreviousPage() : g.showNextPage();
                    break;
                case 66:
                case 190:
                    d && v("#000");
                    break;
                case 87:
                case 188:
                    d && v("#FFF");
                    break;
                case 36:
                    g.showPage(1);
                    break;
                case 35:
                    g.showPage(H.length)
            }
        }))
    })()
};
(function() {
    function b(a, b) {
        var c = new XMLHttpRequest;
        c.onreadystatechange = function() {
            var a, f;
            4 === c.readyState && ((200 <= c.status && 300 > c.status || 0 === c.status) && (a = c.getResponseHeader("content-type")) && q.some(function(b) {
                return b.supportsMimetype(a) ? (f = b, console.log("Found plugin by mimetype and xhr head: " + a), !0) : !1
            }), b(f))
        };
        c.open("HEAD", a, !0);
        c.send()
    }

    function r(a) {
        var b;
        q.some(function(c) {
            return c.supportsFileExtension(a) ? (b = c, !0) : !1
        });
        return b
    }

    function f(a) {
        var b = r(a);
        b && console.log("Found plugin by parameter type: " +
            a);
        return b
    }

    function x(a) {
        a = a.split("?")[0].split(".").pop();
        var b = r(a);
        b && console.log("Found plugin by file extension from path: " + a);
        return b
    }

    function s(a) {
        var b = {};
        (a.search || "?").substr(1).split("&").forEach(function(a) {
            a && (a = a.split("=", 2), b[decodeURIComponent(a[0])] = decodeURIComponent(a[1]))
        });
        return b
    }
    var k, q = [function() {
        var a = "application/vnd.oasis.opendocument.text application/vnd.oasis.opendocument.text-flat-xml application/vnd.oasis.opendocument.text-template application/vnd.oasis.opendocument.presentation application/vnd.oasis.opendocument.presentation-flat-xml application/vnd.oasis.opendocument.presentation-template application/vnd.oasis.opendocument.spreadsheet application/vnd.oasis.opendocument.spreadsheet-flat-xml application/vnd.oasis.opendocument.spreadsheet-template".split(" "),
            b = "odt fodt ott odp fodp otp ods fods ots".split(" ");
        return {
            supportsMimetype: function(b) {
                return -1 !== a.indexOf(b)
            },
            supportsFileExtension: function(a) {
                return -1 !== b.indexOf(a)
            },
            path: "/static/viewerjs/ODFViewerPlugin",
            getClass: function() {
                return ODFViewerPlugin
            }
        }
    }(), {
        supportsMimetype: function(a) {
            return "application/pdf" === a
        },
        supportsFileExtension: function(a) {
            return "pdf" === a
        },
        path: "/static/viewerjs/PDFViewerPlugin",
        getClass: function() {
            return PDFViewerPlugin
        }
    }];
    window.onload = function() {
        var a = document.location.hash.substring(1),
            e = s(document.location),
            c;
        a ? (e.title || (e.title = a.replace(/^.*[\\\/]/, "")), e.documentUrl = a, b(a, function(b) {
            b || (b = e.type ? f(e.type) : x(a));
            b ? "undefined" !== String(typeof loadPlugin) ? loadPlugin(b.path, function() {
                c = b.getClass();
                new Viewer(new c, e)
            }) : (c = b.getClass(), new Viewer(new c, e)) : new Viewer
        })) : new Viewer
    };
    k = document.createElementNS(document.head.namespaceURI, "style");
    k.setAttribute("media", "screen");
    k.setAttribute("type", "text/css");
    k.appendChild(document.createTextNode(viewer_css));
    document.head.appendChild(k);
    k = document.createElementNS(document.head.namespaceURI,
        "style");
    k.setAttribute("media", "only screen and (max-device-width: 800px) and (max-device-height: 800px)");
    k.setAttribute("type", "text/css");
    k.setAttribute("viewerTouch", "1");
    k.appendChild(document.createTextNode(viewerTouch_css));
    document.head.appendChild(k)
})();