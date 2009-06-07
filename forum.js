/* Kodierung: UTF-8 */

/* #################################################################################### */

/* Helferfunktionen */

/* Core-Object-Prototypen */

if (!Object.forEach) {
	Object.forEach = function f_Object_forEach (object, func) {
		for (var property in object) {
			if (object.hasOwnProperty(property)) {
				func.call(object, property, object[property]);
			}
		}
	};
}

if (!Array.prototype.forEach) {
		Array.prototype.forEach = function f_Array_prototype_forEach (func) {
		if (typeof func != "function") throw new TypeError();
		var len = this.length;
		for (var i = 0; i < len; i++) {
			func.call(this, this[i], i);
		}
	};
}

if (!Array.prototype.filter) {
	Array.prototype.filter = function f_Array_prototype_filter (fun) {
		var len = this.length;
		if (typeof fun != "function") throw new TypeError();
		var res = new Array();
		var thisp = arguments[1];
		for (var i = 0; i < len; i++) {
			if (i in this) {
				var val = this[i];
				if (fun.call(thisp, val, i, this)) {
					res.push(val);
				}
			}
		}
		return res;
	};
}

String.prototype.escapeHTML = function f_String_prototype_escapeHTML () {
	return this.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
};

/* DOM-Interface-Prototypen */

if (!Element.prototype.contains) {
	Element.prototype.contains = function f_Node_prototype_contains (arg) {
		return (this.compareDocumentPosition(arg) & 16) == 16;
	};
}

Element.prototype.getElementByXPath = function f_Element_prototype_getElementByXPath (xpathExpression) {
	return document.evaluate(xpathExpression, this, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null).singleNodeValue;
};

Element.prototype.getElementsByXPath = function f_Element_prototype_getElementsByXPath (xpathExpression) {
	return document.evaluate(xpathExpression, this, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
};

XPathResult.prototype.forEach = function f_XPathResult_prototype_forEach (func) {
	var node,
		i = 0,
		iterator = this.resultType == XPathResult.ORDERED_NODE_ITERATOR_TYPE ? 'iterateNext' : 'snapshotItem';
	while (node = this[iterator](i++)) {
		func(node);
	}
};

XPathResult.prototype.toArray = function f_XPathResult_prototype_toArray () {
	var arr = [],
		node,
		i = 0,
		iterator = this.resultType == XPathResult.ORDERED_NODE_ITERATOR_TYPE ? 'iterateNext' : 'snapshotItem';
	while (node = this[iterator](i++)) {
		arr.push(node);
	}
	return arr;
};

/* Klassen */

(function () {
	var regexpCache = {};
	var p = Element.prototype;
	p.toggleClass = function Element_prototype_toggleClass (className) {
		if (this.hasClass(className)) {
			this.removeClass(className);
		} else {
			this.addClass(className);
		}
	};
	p.addClass = function Element_prototype_addClass (className) {
		if (!this.hasClass(className)) {
			this.className += (this.className ? " " : "") + className;
		}
	};
	p.removeClass = function Element_prototype_removeClass (className) {
		this.className = this.className.replace(new RegExp("(^|\\s)" + className + "(\\s|$)"), "$2");
	};
	p.hasClass = function Element_prototype_hasClass (className) {
		return (" " + this.className + " ").indexOf(" " + className + " ") > -1;
	};
	delete p;
})();

/* #################################################################################### */

/* SELFHTML- und Forums-Namensraum */

var SELFHTML = {};

SELFHTML.Forum = {};

/* #################################################################################### */

/* Häufige XPath-Abfragefunktionen */

SELFHTML.Forum.getThreadStart = function SELFHTML_Forum_getThreadStart (li) {
	return li.getElementByXPath("ancestor::li[contains(@class, 'thread-start')]");
};


/* #################################################################################### */

/* Debugging-Namensraum */

SELFHTML.Forum.Debug = {};

/* Helferfunktionen für XPath-Benchmarks */

SELFHTML.Forum.Debug = function f_SELFHTML_Forum_Debug (xpathExpression, contextNode, iterations) {
	contextNode = contextNode || document.documentElement;
	iterations = iterations || 500;
	console.log("benchmarking", xpathExpression, "at", contextNode);
	var start = new Date().getTime();
	try {
		for (var i = 0; i < iterations; i++) {
			var result = document.evaluate(xpathExpression, contextNode, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		}
	} catch (e) {
		console.debug(e);
		return;
	}
	var end = new Date().getTime();
	console.log(xpathExpression, "found", result.snapshotLength, "nodes in ", (end - start), "ms");
	return result;
};

Function.prototype.benchmark = function f_Function_prototype_benchmark (iterations) {
	console.log("benchmarking a function");
	iterations = iterations || 1000;
	var start = new Date().getTime();
	for (var i = 0; i < iterations; i++) {
		var result = this();
	}
	var end = new Date().getTime();
	console.log(iterations, "iterations took", (end - start), "ms");
	return result;
};

/* #################################################################################### */

/* Modul-Initialisierung */

SELFHTML.Forum.Modules = {};

SELFHTML.Forum.Modules.queue = [];

SELFHTML.Forum.Modules.add = function f_SELFHTML_Forum_Modules_add (documentType, module) {
	SELFHTML.Forum.Modules.queue.push({
		documentType : documentType,
		module : module
	});
};

SELFHTML.Forum.Modules.init = function f_SELFHTML_Forum_Modules_init () {
	SELFHTML.Forum.Modules.queue.forEach(function f_SELFHTML_Forum_Modules_queue_forEach (obj) {
		if (document.body.id == "selfforum-" + obj.documentType || obj.documentType == "all") {
			obj.module.init();
		}
	});
};

document.addEventListener("DOMContentLoaded", SELFHTML.Forum.Modules.init, false);

/* #################################################################################### */

/* Globale Initialisierung */

SELFHTML.Forum.init = function f_SELFHTML_Forum_Init () {
	SELFHTML.Forum.ready = true;
};

SELFHTML.Forum.Modules.add("all", SELFHTML.Forum);

/* #################################################################################### */

/* Initialisierung Hauptseite */

SELFHTML.Forum.Hauptseite = {};

SELFHTML.Forum.Hauptseite.init = function f_SELFHTML_Forum_Hauptseite_init () {
	SELFHTML.Forum.threadList = document.getElementById("root");
};

SELFHTML.Forum.Modules.add("hauptseite", SELFHTML.Forum.Hauptseite);

/* #################################################################################### */

/* Thread List Cache */

SELFHTML.Forum.ThreadListCache = {};

SELFHTML.Forum.ThreadListCache.init = function f_SELFHTML_Forum_ThreadListCache_init () {

	var F = SELFHTML.Forum,
	
		postingsByAuthor = (F.postingsByAuthor = {}),
		threadStartsByAuthor = (F.threadStartsByAuthor = {}),
		ownPostings = (F.ownPostings = []),
		postingsByCategory = (F.postingsByCategory = {}),
		
		authorSpans = F.threadList.getElementsByClassName ?
			F.threadList.getElementsByClassName('author') :
			F.threadList.getElementsByXPath("descendant::span[@class = 'author']").toArray();
	
	for (var i = 0, length = authorSpans.length; i < length; i++) {
	
		var authorSpan = authorSpans[i],
			authorName = authorSpan.firstChild.nodeValue,
			postingSpan = authorSpan.parentNode,
			li = postingSpan.parentNode,
			postingId = li.id,
			parentLi = li.parentNode.parentNode,
			categoryName;
		
		/* Save in own postings hash */
		if (li.hasClass("own-posting")) {
			ownPostings.push(li);
			if (!F.ownName) {
				F.ownName = authorName;
			}
		}
		
		/* Save in author hash */
		(postingsByAuthor[authorName] || (postingsByAuthor[authorName] = [])).push(li);
		
		/* Save in thread start hash */
		if (parentLi.hasClass("thread-start")) {
			(threadStartsByAuthor[authorName] || (threadStartsByAuthor[authorName] = [])).push(parentLi);
		}
		
		/* Save in category hash */
		categoryName = postingSpan
			.firstChild // span.subject
			.firstChild // span.category
			.childNodes[1] // second text node
			.nodeValue;
		(postingsByCategory[categoryName] || (postingsByCategory[categoryName] = [])).push(li);
		
	}

};

SELFHTML.Forum.Modules.add("hauptseite", SELFHTML.Forum.ThreadListCache);

/* #################################################################################### */

/* Kontextmenü */

SELFHTML.Forum.ContextMenu = {};

SELFHTML.Forum.ContextMenu.init = function f_SELFHTML_Forum_ContextMenu_init () {

	var F = SELFHTML.Forum, M = F.ContextMenu;
	M.target = document.getElementById("contextMenuTitle");
	F.threadList.addEventListener("click", M.toggle, false);
	F.threadList.addEventListener("mouseover", M.threadListMouseOver, true);

};

SELFHTML.Forum.Modules.add("hauptseite", SELFHTML.Forum.ContextMenu);

SELFHTML.Forum.ContextMenu.toggle = function f_SELFHTML_Forum_ContextMenu_toggle (e) {

	var F = SELFHTML.Forum, C = F.Config, M = F.ContextMenu, Fi = F.Filter, S = F.Statistics,
		target = e.target,
		isAuthor = target.hasClass("author"),
		isNormalCategory = target.hasClass("category"),
		isHighlightedCategory = target.hasClass("cathigh"),
		isCategory = isNormalCategory || isHighlightedCategory;

	if (!(isAuthor || isCategory)) {
		M.hide();
		return;
	}

	var links = {};

	if (isAuthor) {

		var authorName = target.firstChild.nodeValue,
			isOwnPosting = target.hasClass("own-posting"),
			isWhitelisted = target.hasClass("whitelist")

		links["Filtere nach Autor"] = function () { Fi.filterByAuthor(authorName); };

		if (isWhitelisted) {
			links["Autor von der Whitelist löschen"] = function () { C.removeFromWhiteList(authorName); };
		} else if (!isOwnPosting) {
			links["Autor zur Whitelist hinzufügen"] = function () { C.addToWhiteList(authorName); };
		}
		if (!isOwnPosting) {
			links["Autor zur Blacklist hinzufügen"] = function () { C.addToBlackList(authorName); };
		}

		links["Zeige Autoren-Statistik"] = function () { S.show("author"); };


	} else if (isCategory) {

		var categoryName = target.childNodes[1].nodeValue;

		links["Filtere nach Themenbereich"] = function () { Fi.filterByCategory(categoryName); };

		if (isNormalCategory) {
			links["Themenbereich hervorheben"] = function () { C.addToHighlightCategories(categoryName); };
		} else {
			links["Themenbereich nicht mehr hervorheben"] = function () { C.removeFromHighlightCategories(categoryName); };
		}

		links["Zeige Themenbereich-Statistik"] = function () { S.show("category"); };

	}

	links["Menü ausblenden"] = function () { M.hide() };

	M.show(target, links);
};

SELFHTML.Forum.ContextMenu.show = function f_SELFHTML_Forum_ContextMenu_show (target, links) {
	var F = SELFHTML.Forum, M = F.ContextMenu;
	
	if (M.target) {
		M.target.removeAttribute("id");
	}
	target.id = "contextMenuTitle";

	var layer = new F.Layer( { id : "contextMenu", tagName : "ul" } ),
		ul = layer.element;
	
	while (ul.firstChild) {
		ul.removeChild(ul.firstChild);
	}
	Object.forEach(links, function (title, originalHandler) {
		var handler = function (e) {
			e.preventDefault();
			originalHandler.call(this, e);
		};
		var li = document.createElement("li");
		ul.appendChild(li);
		var a = document.createElement("a");
		li.appendChild(a);
		a.href = "javascript:void(0)";
		a.addEventListener("click", handler, false);
		a.appendChild(document.createTextNode(title));
	});
	ul.style.top = (target.offsetTop + target.offsetHeight) + "px";
	ul.style.left = target.offsetLeft + "px";
	layer.show();
	M.target = target;
};

SELFHTML.Forum.ContextMenu.hide = function f_SELFHTML_Forum_ContextMenu_hide () {
	var F = SELFHTML.Forum, M = F.ContextMenu;
	if (M.target) {
		M.target.removeAttribute("id");
	}
	new F.Layer( { id : "contextMenu" } ).hide();
};

SELFHTML.Forum.ContextMenu.threadListMouseOver = function f_SELFHTML_Forum_ContextMenu_threadListMouseOver (e) {
	var F = SELFHTML.Forum, target = e.target;
	if (!target.hasClass("javascript-button") && (target.hasClass("author") || target.hasClass("category") || target.hasClass("cathigh"))) {
		target.addClass("javascript-button");
	}
};

/* #################################################################################### */

/* Layer-Abstraktion */

SELFHTML.Forum.Layer = function f_SELFHTML_Forum_Layer (options) {
	if (!options || !options.id) {
		throw new TypeError;
	}
	var layers = arguments.callee.layers || (arguments.callee.layers = {});
	if (layers[options.id]) {
		return layers[options.id];
	}

	if (!options.tagName) {
		return;
	}
	if (!options.parent) {
		options.parent = document.body;
	}
	var element = document.createElement(options.tagName);
	element.id = options.id;
	if (options.className) {
		element.className = options.className;
	}
	options.parent.appendChild(element);
	this.element = element;
	layers[options.id]  = this;
};

SELFHTML.Forum.Layer.prototype = {
	show : function  f_Layer_prototype_show () {
		if (this.element) {
			this.element.style.display = "block";
		}
		return this;
	},
	hide : function f_Layer_prototype_hide () {
		if (this.element) {
			this.element.style.display = "none";
		}
		return this;
	},
	html : function f_Layer_prototype_html (html) {
		if (this.element) {
			this.element.innerHTML = html;
		}
		return this;
	}
};

/* #################################################################################### */

/* Info-Meldung im Header */

SELFHTML.Forum.Info = {};

SELFHTML.Forum.Info.show = function f_SELFHTML_Forum_Info_show (html) {
	new SELFHTML.Forum.Layer( { id : "scriptInfo", tagName : "div", parent : document.getElementById("kopf-haupt") } ).html(html).show();
};

SELFHTML.Forum.Info.hide = function f_SELFHTML_Forum_Info_hide (html) {
	new SELFHTML.Forum.Layer( { id : "scriptInfo" } ).hide();
};

/* #################################################################################### */

/* Filter */

SELFHTML.Forum.Filter = {};

SELFHTML.Forum.Filter.init = function f_SELFHTML_Forum_Filter_init () {
	var Fi = SELFHTML.Forum.Filter;
	
	Fi.active = false;
	Fi.highlightedPostings = [];
	Fi.filteredThreads = [];
	
	Fi.initCategoryFilter();
};

SELFHTML.Forum.Modules.add("hauptseite", SELFHTML.Forum.Filter);

SELFHTML.Forum.Filter.initCategoryFilter = function f_SELFHTML_Forum_Filter_initCategoryFilter () {
	var F = SELFHTML.Forum, Fi = F.Filter,
		form = document.getElementById("themenfilter").getElementsByTagName("form")[0];
	
	form.addEventListener("submit", function (e) {
		e.preventDefault();
		var select = this.elements.lf,
			selectedOption = select.options[select.selectedIndex],
			categoryName = selectedOption.text;
		if (selectedOption.value) {
			Fi.filterByCategory(categoryName);
		} else {
			Fi.remove();
		}
	}, false);
};

SELFHTML.Forum.Filter.filterByAuthor = function f_SELFHTML_Forum_Filter_filterByAuthor (authorName) {
	var F = SELFHTML.Forum, Fi = F.Filter;
	
	Fi.remove();
	F.ContextMenu.hide();
	
	var postings = F.postingsByAuthor[authorName];
	if (postings) {
		postings.forEach(function f_filterByAuthor_postings_forEach (li) {
			li.addClass("highlighted");
			Fi.highlightedPostings.push(li);
		
			var threadStart = F.getThreadStart(li);
			threadStart.addClass("contains-filter-postings");
			Fi.filteredThreads.push(threadStart);
	
		});
	}
	
	// Redraw
	F.threadList.addClass("filter");
	
	F.Info.show("Gefiltert nach Autor " + authorName + " &ndash; <a href='javascript:SELFHTML.Forum.Filter.remove()'>Filter entfernen</a>");
	
	Fi.active = true;
};

SELFHTML.Forum.Filter.filterByCategory = function f_SELFHTML_Forum_Filter_filterByCategory (categoryName) {
	var F = SELFHTML.Forum, Fi = F.Filter;
	
	Fi.remove();
	F.ContextMenu.hide();
	
	var postings = F.postingsByCategory[categoryName];
	if (postings) {
		postings.forEach(function f_filterByCategory_postings_forEach (li) {
			var threadStart = F.getThreadStart(li);
			threadStart.addClass("contains-filter-postings");
			Fi.filteredThreads.push(threadStart);
		});
	}
	
	// Redraw
	F.threadList.addClass("filter");
	
	F.Info.show("Gefiltert nach Themenbereich " + categoryName + " &ndash; <a href='javascript:SELFHTML.Forum.Filter.remove()'>Filter entfernen</a>");
	
	Fi.active = true;
};

SELFHTML.Forum.Filter.remove = function f_SELFHTML_Forum_Filter_remove () {
	var F = SELFHTML.Forum, Fi = F.Filter;
	
	if (!Fi.active) return;
	
	F.Info.hide();
	
	var threadStart, li;
	while (threadStart = Fi.filteredThreads.shift()) {
		threadStart.removeClass("contains-filter-postings");
	}
	while (li = Fi.highlightedPostings.shift()) {
		li.removeClass("highlighted");
	}
	
	// Redraw
	F.threadList.removeClass("filter");
	
	Fi.active = false;
};

/* #################################################################################### */

SELFHTML.Forum.FollowupNotice = {};

SELFHTML.Forum.FollowupNotice.init = function f_SELFHTML_Forum_FollowupNotice_init () {
	
	var F = SELFHTML.Forum,
		newFollowupNodes = F.threadList
			.getElementsByXPath("descendant::li[contains(@class, 'own-posting')]/child::ul/child::li[not(contains(@class, 'visited'))]")
			.toArray();
	
	/*
	An welches Element soll die Meldungsbox »Neue Antworten« angehängt werden?
	kopf-menu = Zelle in der linken Spalte in der Kopftabelle
	*/
	var targetId = "kopf-menue",
		targetElement = document.getElementById(targetId);
	if (!targetElement) return;

	var start = new Date().getTime(),
		newFollowups = [];

	newFollowupNodes.forEach(function f_newFollowupNodes_forEach1 (newFollowupNode) {
		
		var newFollowup, posting, aElement, author;
		
		newFollowup = {};
		newFollowup.element = newFollowupNode;

		posting = newFollowupNode.getElementByXPath("(child::span | child::span/child::span)[contains(@class, 'posting')]");

		aElement = posting.getElementByXPath("child::span[contains(@class, 'subject')]/child::a");

		/* Link hat keine visited-Klasse, ist aber in der Browser-History als besucht markiert */
		if (window.getComputedStyle(aElement, null).outlineStyle == "solid") {
			console.log('Link hat keine visited-Klasse, ist aber in der Browser-History als besucht markiert');
			return;
		}

		newFollowup.title = aElement.firstChild.nodeValue;
		newFollowup.href = aElement.href;

		author = posting.getElementByXPath("child::span[contains(@class, 'author')]/text()");
		newFollowup.author = author.nodeValue;

		newFollowups.push(newFollowup);

	});

	/* Erzeuge Meldungsbox (div-Element mit h2-Element) */
	var layer = new F.Layer( { id : "followup-notice", tagName : "div", parent : targetElement } );

	var divHTML = "";
	if (newFollowups.length > 0) {
		layer.element.className = "new-anwers";
		divHTML += "<h2>Neue Antworten</h2>";
		divHTML += "<ul>";
		newFollowups.forEach(function f_newFollowupNodes_forEach2 (newFollowup) {
			divHTML += "<li><a href='" + newFollowup.href + "'>" + newFollowup.title.escapeHTML() + "</a>";
			divHTML += " von " + newFollowup.author.escapeHTML() + "</li>";
		});
		divHTML += "</ul>";
	} else {
		layer.element.className = "no-anwers";
		divHTML += "<h2>Keine neuen Antworten</h2>";
	}

	layer.html(divHTML);
}

SELFHTML.Forum.Modules.add("hauptseite", SELFHTML.Forum.FollowupNotice);

/* #################################################################################### */

SELFHTML.Forum.Config = {};

SELFHTML.Forum.Config.directives = {
	"BlackList" : { parameter : "blacklist", type : "list" },
	"WhiteList" : { parameter : "whitelst", type : "list" },
	"HighlightCategories" : { parameter : "highlightcats", type : "list" },
	"SortThreads" : { parameter : "sortthreads", type : "single" }
};

SELFHTML.Forum.Config.init = function f_SELFHTML_Forum_Config_init () {
	var F = SELFHTML.Forum, C = F.Config;

	Object.forEach(C.directives, function (directive, obj) {
		if (obj.type != "list") return;
		C["addTo" + directive] = function (value) {
			C.setValue(directive, value);
			C.confirmReload();
		};
		C["removeFrom" + directive] = function (value) {
			C.removeValue(directive, value);
			C.confirmReload();
		};
	});
};

SELFHTML.Forum.Modules.add("hauptseite", SELFHTML.Forum.Config);

SELFHTML.Forum.Config.setValue = function f_SELFHTML_Forum_Config_setValue (directive, value) {
	var F = SELFHTML.Forum, C = F.Config, obj = C.directives[directive];
	if (!obj) return;
	var uri  = userconf_uri + "?a=setvalue&directive=" + directive + "&" + obj.parameter + "=" + encodeURIComponent(value) +
		(obj.type == "list" ? "&type=stringlist" : "") + "&unique=" + new Date().getTime();
	xmlhttp_get_contents(xmlhttp, uri, null, null);
};

SELFHTML.Forum.Config.removeValue = function f_SELFHTML_Forum_Config_removeValue (directive, value) {
	var F = SELFHTML.Forum, C = F.Config, obj = C.directives[directive];
	if (!obj) return;
	var uri  = userconf_uri + "?a=removevalue&directive=" + directive + "&" + obj.parameter + "=" + encodeURIComponent(value) +
		(obj.type == "list" ? "&type=stringlist" : "") + "&unique=" + new Date().getTime();
	xmlhttp_get_contents(xmlhttp, uri, null, null);
};

SELFHTML.Forum.Config.confirmReload = function f_SELFHTML_Forum_Config_confirmReload () {
	var reloadDialog = "Die Einstellung wurde auf dem Server gespeichert. Soll die Forumshauptseite jetzt neu geladen werden?";
	if (window.confirm(reloadDialog)) {
		location.reload();
	}
};

/* #################################################################################### */

/* Statistiken */

SELFHTML.Forum.Statistics = {};

SELFHTML.Forum.Statistics.init = function f_SELFHTML_Forum_Statistics_init (type) {
	if (typeof type != "string") {
		arguments.callee("author");
		arguments.callee("category");
		return;
	}

	var F = SELFHTML.Forum, Fi = F.Filter, S = F.Statistics,
		postingsByType = (type == "author") ? F.postingsByAuthor : F.postingsByCategory,
		typeName,
		ranking = [];

	Object.forEach(postingsByType, function f_ranking_push_postingNumber (typeName, postings) {
		ranking.push( {
			"typeName" : typeName,
			"postingNumber" : postings.length
		} );
	});

	ranking.sort(function f_ranking_sort (a, b) {
		return a.postingNumber > b.postingNumber ? -1 : 1;
	});

	if (type == "author") {
		F.authorRanking = ranking;
	} else {
		F.categoryRanking = ranking;
	}

	var html = "<p><a href='javascript:void(0)' class='hide'>Ausblenden</a></p>";
	html += "<table><tbody>";
	ranking.forEach(function f_ranking_append_html (obj) {
		html += "<tr><th><a href='javascript:void(0)'>" + obj.typeName.escapeHTML() + "</th><td>" + obj.postingNumber + "</td></tr>";
	});
	html += "</tbody></table>";

	var layer = new F.Layer( { id : type + "Statistics", tagName : "div", className : "statistics" } );
	layer.html(html);
	
	layer.element.addEventListener("click", function (e) {
		e.preventDefault();
		var target = e.target;
		if (target.nodeName.toLowerCase() != "a") return;
		S.hide();
		if (target.hasClass("hide")) return;
		var filterFunctionName = "filterBy" + (type == "author" ? "Author" : "Category");
		Fi[filterFunctionName](target.textContent);
	}, false);

};

SELFHTML.Forum.Modules.add("hauptseite", SELFHTML.Forum.Statistics);

SELFHTML.Forum.Statistics.show = function f_SELFHTML_Forum_Statistics_show (type) {
	var F = SELFHTML.Forum;
	F.ContextMenu.hide();
	var layer = new F.Layer( { id : type + "Statistics" } );
	layer.show();
	var top = window.pageYOffset + 10, height = window.innerHeight - 10 - 10 - (2 * 5) - 2 - 16;
	layer.element.style.top = top + "px";
	layer.element.style.maxHeight = height + "px";
};

SELFHTML.Forum.Statistics.hide = function f_SELFHTML_Forum_Statistics_hide () {
	var F = SELFHTML.Forum;
	new F.Layer( { id : "categoryStatistics" } ).hide();
	new F.Layer( { id : "authorStatistics" } ).hide();
};

/* #################################################################################### */

SELFHTML.Forum.Sorting = {};

SELFHTML.Forum.Sorting.init = function f_SELFHTML_Forum_Sorting_init () {
	var sibling = document.getElementById("themenfilter");
	if (!sibling) return;
	var elem = document.createElement("div");
	elem.id = "sortierung";
	elem.innerHTML =
		"<p><strong>Sortierung der Threads:</strong></p>" +
		"<ul>" +
		"<li><label title='Threads nach Eröffnungsposting chronologisch absteigend sortieren (neue Threads oben, alte Threads unten)'><input type='radio' name='sortthreads' value='descending' />&nbsp;Absteigend (Standard)</label></li>" +
		"<li><label title='Threads nach Eröffnungsposting chronologisch absteigend sortieren (alte Threads oben, neue Threads unten)'><input type='radio' name='sortthreads' value='ascending' />&nbsp;Aufsteigend</label></li>" +
		"<li><label title='Threads nach dem jüngsten Posting sortieren (Threads mit neuen Postings oben, nicht mehr aktive unten)'><input type='radio' name='sortthreads' value='newestfirst' />&nbsp;Nach jüngstem Posting</label></li>" +
		"</ul>";
	elem.addEventListener("click", SELFHTML.Forum.Sorting.change, false);
	sibling.parentNode.insertBefore(elem, sibling);
};

SELFHTML.Forum.Modules.add("hauptseite", SELFHTML.Forum.Sorting);

SELFHTML.Forum.Sorting.change = function f_SELFHTML_Forum_Sorting_change (e) {
	var C = SELFHTML.Forum.Config,
		target = e.target, targetName = target.nodeName.toLowerCase(),
		value;
	if (targetName != "input") {
		return;
	}
	e.stopPropagation();
	C.setValue("SortThreads", target.value);
	C.confirmReload();
};

/* #################################################################################### */