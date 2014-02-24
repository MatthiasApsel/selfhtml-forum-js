/*!
JavaScript für die benutzerspezifische Ansicht des SELFHTML-Forums (http://forum.de.selfhtml.org/)
Author: Mathias Schäfer (molily)
Lizenz: MIT License
*/

(function () {

'use strict';

// ####################################################################################

// Check browser support

var
  div = document.createElement('div'),
  supported =
    div.querySelector && div.querySelectorAll &&
    div.classList && div.classList.contains &&
    div.textContent === '' &&
    div.addEventListener &&
    window.getComputedStyle &&
    window.XMLHttpRequest &&
    Function.prototype.bind;

if (!supported) {
  if (window.console && console.error) {
    console.error('JavaScript-Erweitungen: Sie verwenden einen nicht unterstützten Browser. Bitte verwenden Sie eine aktuelle Browserversion.');
  }
  return;
}
div = undefined;

// ####################################################################################

// Helfer

var forEach = function (object, func) {
  for (var property in object) {
    func.call(object, property, object[property]);
  }
};

var escapeHTML = function (string) {
  return string
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&lt;')
    .replace(/'/g, '&quot;')
    .replace(/'/g, '&#39;');
};

var slice = Array.prototype.slice;

if (!Array.from) {
  Array.from = function (list) {
    return slice.call(list);
  };
}

// ####################################################################################

// Modulverwaltung

var Modules = {};

Modules.queue = [];

Modules.add = function (module) {
  Modules.queue.push(module);
};

Modules.init = function () {
  Modules.queue.forEach(function (module) {
    if (module.documentType == 'all' || document.body.id == 'selfforum-' + module.documentType) {
      module.init();
    }
  });
};

document.addEventListener('DOMContentLoaded', Modules.init);

// ####################################################################################

// Hauptobjekt mit Caches

var Forum = {};
Modules.add(Forum);

Forum.documentType = 'all';

Forum.init = function () {
  Forum.ownName = null;
  Forum.postingsByAuthor = {};
  Forum.threadStartsByAuthor = {};
  Forum.ownPostings = [];
  Forum.postingsByCategory = {};
};

Forum.getThreadStart = function (li) {
  var parent = li;
  while (parent = parent.parentNode) {
    if (parent.tagName == 'LI' && parent.classList.contains('thread-start')) {
      return parent;
    }
  }
  return false;
};

// ####################################################################################

var MainPage = {};
Modules.add(MainPage);

MainPage.documentType = 'hauptseite';

MainPage.init = function () {
  Forum.threadList = document.getElementById('root');
};

// ####################################################################################

var ThreadCache = {};
Modules.add(ThreadCache);

ThreadCache.documentType = 'hauptseite';

ThreadCache.init = function () {
  var elements = Forum.threadList.querySelectorAll('.posting');
  Array.from(elements).forEach(ThreadCache.analyzePosting);
};

ThreadCache.analyzePosting = function (postingSpan) {
  var li = postingSpan.parentNode;
  var parentLi = li.parentNode.parentNode;

  // Save thread start
  if (parentLi.classList.contains('thread-start')) {
    var threadStarts = Forum.threadStartsByAuthor[author];
    if (!threadStarts) {
      threadStarts = Forum.threadStartsByAuthor[author] = []
    }
    threadStarts.push(parentLi);
  }

  // Save posting by author
  var authorSpan = postingSpan.querySelector('.author');
  if (authorSpan) {
    var author = authorSpan.textContent;

    var postingsByAuthor = Forum.postingsByAuthor[author];
    if (!postingsByAuthor) {
      postingsByAuthor = Forum.postingsByAuthor[author] = [];
    }
    postingsByAuthor.push(li);

    // Save own postings
    if (authorSpan.classList.contains('own-posting')) {
      Forum.ownPostings.push(li);
      // Save own name
      if (!Forum.ownName) {
        Forum.ownName = author;
      }
    }
  }

  // Save posting by category
  var categorySpan = postingSpan.querySelector('.category, .cathigh');
  if (categorySpan) {
    var category = categorySpan.textContent;

    var postingsByCategory = Forum.postingsByCategory[category];
    if (!postingsByCategory) {
      postingsByCategory = Forum.postingsByCategory[category] = [];
    }
    postingsByCategory.push(li);
  }
};

// ####################################################################################

var Menu = {};
Modules.add(Menu);

Menu.documentType = 'hauptseite';

Menu.init = function () {
  Menu.target = document.getElementById('context-menu-title');
  Menu.visible = false;
  Menu.links = null;
  Forum.threadList.addEventListener('contextmenu', Menu.toggle);
  document.body.addEventListener('click', Menu.hide);
};


Menu.addLinks = function (target, linkType) {
  Menu.links = [];

  if (linkType == 'author') {
    Menu.addAuthorLinks(target);
  } else if (linkType == 'category') {
    Menu.addCategoryLinks(target);
  }

  Menu.addLink('Schließen', Menu.hide);

  return Menu.links;
};

Menu.toggle = function (event) {
  var
    target = event.target,
    isAuthor = target.classList.contains('author'),
    isNormalCategory = target.classList.contains('category'),
    isHighlightedCategory = target.classList.contains('cathigh'),
    isCategory = isNormalCategory || isHighlightedCategory,
    linkType = isAuthor ? 'author' : (isCategory ? 'category' : false);

  if (linkType) {
    event.preventDefault();
    // Remove possible selection
    if (window.getSelection) {
      var selection = window.getSelection();
      if (selection.removeAllRanges) {
        selection.removeAllRanges();
      }
    }
    Menu.addLinks(target, linkType);
    Menu.show(target);
  } else {
    Menu.hide();
  }
};

Menu.addLink = function (title, handler) {
  var args = [].slice.call(arguments, 2);
  var curriedHandler = function () {
    handler.apply(null, args);
  };
  Menu.links.push({
    title: title,
    handler: curriedHandler
  });
};

Menu.addAuthorLinks = function (target) {
  var authorName = target.textContent,
    isOwnPosting = target.classList.contains('own-posting'),
    isWhitelisted = target.classList.contains('whitelist');

  Menu.addLink(
    'Filtere nach Autor/in',
    Filter.filterByAuthor,
    authorName
  );

  if (isWhitelisted) {
    Menu.addLink(
      'Autor/in von der Whitelist löschen',
      Config.removeFromWhiteList,
      authorName
    );
  } else if (!isOwnPosting) {
    Menu.addLink(
      'Autor/in zur Whitelist hinzufügen',
      Config.addToWhiteList,
      authorName
    );
  }

  if (!isOwnPosting) {
    Menu.addLink(
      'Autor/in zur Blacklist hinzufügen',
      Config.addToBlackList,
      authorName
    );
  }

  Menu.addLink(
    'Zeige Autor/innen-Statistik',
    Stats.show,
    'author'
  );
};

Menu.addCategoryLinks = function (target) {
  var categoryName = target.textContent,
    isHighlighted = target.classList.contains('cathigh');

  Menu.addLink(
    'Filtere nach Themenbereich',
    Filter.filterByCategory,
    categoryName
  );

  if (isHighlighted) {
    Menu.addLink(
      'Themenbereich nicht mehr hervorheben',
      Config.removeFromHighlightedCategories,
      categoryName
    );
  } else {
    Menu.addLink(
      'Themenbereich hervorheben',
      Config.addToHighlightedCategories,
      categoryName
    );
  }

  Menu.addLink(
    'Zeige Themenbereich-Statistik',
    Stats.show,
    'category'
  );
};

Menu.show = function (target) {
  if (Menu.target) {
    Menu.target.removeAttribute('id');
  }
  target.id = 'context-menu-title';

  var
    layer = createLayer({ id: 'context-menu', tagName: 'ul' }),
    ul = layer.element;

  // Lösche vorhandenen Inhalt
  ul.innerHTML = '';

  // Erzeuge Links
  Menu.links.forEach(function (link) {
    var handler = function (event) {
      event.preventDefault();
      link.handler();
    };
    var li = document.createElement('li');
    var a = document.createElement('a');
    li.appendChild(a);
    a.href = '';
    a.addEventListener('click', handler);
    a.appendChild(document.createTextNode(link.title));
    ul.appendChild(li);
  });
  ul.style.top = (target.offsetTop + target.offsetHeight) + 'px';
  ul.style.left = target.offsetLeft - 1 + 'px';
  layer.show();
  Menu.target = target;
};

Menu.hide = function () {
  if (Menu.target) {
    Menu.target.removeAttribute('id');
  }
  var layer = getLayer('context-menu');
  if (layer) {
    layer.hide();
  }
};

// ####################################################################################

var layers = {};

var createLayer = function (options) {
  if (!options || !options.id) {
    throw new TypeError('Layer needs an ID');
  }
  var id = options.id;
  var layer = layers[id];
  if (layer) {
    return layer;
  }
  layer = new Layer(options);
  layers[id] = layer;
  return layer;
};

var getLayer = function (id) {
  return layers[id];
};

var Layer = function (options) {
  if (!options.tagName) {
    options.tagName = 'div';
  }
  var element = document.createElement(options.tagName);
  this.element = element;
  element.id = options.id;
  if (options.className) {
    element.className = options.className;
  }
  if (!options.parent) {
    options.parent = document.body;
  }
  options.parent.appendChild(element);
};

Layer.prototype.show = function () {
  if (this.element) {
    this.element.style.display = 'block';
  }
  return this;
};

Layer.prototype.hide = function () {
  if (this.element) {
    this.element.style.display = 'none';
  }
  return this;
};

Layer.prototype.remove = function () {
  var element = this.element;
  element.parentNode.removeChild(element);
  delete layers[this.element.id];
  return this;
};

Layer.prototype.html = function (html) {
  if (this.element) {
    this.element.innerHTML = html;
  }
  return this;
};

// ####################################################################################

var Filter = {};
Modules.add(Filter);

Filter.documentType = 'hauptseite';

Filter.init = function () {
  Filter.active = false;
  Filter.highlightedPostings = [];
  Filter.filteredThreads = [];
  Filter.initCategoryFilter();
};

Filter.initCategoryFilter = function () {
  var form = document.querySelector('#themenfilter form');
  form.addEventListener('submit', Filter.formSubmit);
  var select = form.querySelector('select');
  select.addEventListener('change', Filter.formSubmit);
};

Filter.formSubmit = function (event) {
  event.preventDefault();
  var select = document.querySelector('#themenfilter select'),
    selectedOption = select.options[select.selectedIndex],
    categoryName = selectedOption.text;
  if (selectedOption.value) {
    Filter.filterByCategory(categoryName);
  } else {
    Filter.remove();
  }
};

Filter.filter = function (infoText) {
  Menu.hide();
  Forum.threadList.classList.add('filtered');
  infoText = infoText + ' &ndash; ' +
    '<a href="" class="remove-posting-filter">Filter entfernen</a>';
  var layer = createLayer({
    id: 'filter-status',
    parent: document.getElementById('beschreibung')
  });
  layer.html(infoText).show();
  layer.element.addEventListener('click', Filter.checkRemoveFilter);
  Filter.active = true;
};

Filter.filterByAuthor = function (authorName) {
  Filter.remove();
  var postings = Forum.postingsByAuthor[authorName];
  if (postings) {
    postings.forEach(function (postingSpan) {
      postingSpan.classList.add('highlighted');
      Filter.highlightedPostings.push(postingSpan);

      var threadStart = Forum.getThreadStart(postingSpan);
      threadStart.classList.add('contains-filter-postings');
      Filter.filteredThreads.push(threadStart);
    });
  }
  Filter.filter('Gefiltert nach Autor/in ' + authorName);
};

Filter.filterByCategory = function (categoryName) {
  Filter.remove();

  var postings = Forum.postingsByCategory[categoryName];
  if (postings) {
    postings.forEach(function (li) {
      var threadStart = Forum.getThreadStart(li);
      threadStart.classList.add('contains-filter-postings');
      Filter.filteredThreads.push(threadStart);
    });
  }

  Filter.filter('Gefiltert nach Themenbereich ' + categoryName);
};

Filter.checkRemoveFilter = function (event) {
  event.preventDefault();
  if (event.target.classList.contains('remove-posting-filter')) {
    Filter.remove();
  }
};

Filter.remove = function () {
  if (!Filter.active) return;

  getLayer('filter-status').hide();

  var threadStart;
  while (threadStart = Filter.filteredThreads.shift()) {
    threadStart.classList.remove('contains-filter-postings');
  }
  var postingSpan;
  while (postingSpan = Filter.highlightedPostings.shift()) {
    postingSpan.classList.remove('highlighted');
  }

  Forum.threadList.classList.remove('filtered');

  Filter.active = false;
};

// ####################################################################################

var AnswerNotice = {};
Modules.add(AnswerNotice);

AnswerNotice.documentType = 'hauptseite';

AnswerNotice.init = function () {

  var
    selector = 'li.own-posting > ul > li:not(.visited) > .posting',
    answerElements = Array.from(Forum.threadList.querySelectorAll(selector));

  /*
  An welches Element soll die Meldungsbox »Neue Antworten« angehängt werden?
  kopf-menu = Zelle in der linken Spalte in der Kopftabelle
  */
  var
    targetId = 'beschreibung',
    targetElement = document.getElementById(targetId);
  if (!targetElement) return;

  var answers = [];

  var answers = answerElements.map(function (postingSpan) {
    var
      aElement = postingSpan.querySelector('a'),
      titleSpan = postingSpan.querySelector('.title'),
      authorSpan = postingSpan.querySelector('.author');

    return {
      title: titleSpan.textContent,
      href: aElement.href,
      author: authorSpan.textContent
    };
  });

  if (answers.length == 0) return;

  // Erzeuge Meldungsbox (div-Element mit h2-Element)
  var layer = createLayer({
    id: 'answer-notice',
    tagName: 'div',
    parent: targetElement
  });

  var divHTML = '';
  divHTML +=
    '<h2>Neue Antworten</h2>' +
    '<ul>';
  answers.forEach(function (answer) {
    divHTML +=
      '<li><a href="' + answer.href + '">' +
      escapeHTML(answer.title) +
      '</a> von ' +
      escapeHTML(answer.author) +
      '</li>';
  });
  divHTML += '</ul>';
  layer.html(divHTML);
};

// ####################################################################################

var Config = {};

Config.documentType = 'hauptseite';
Modules.add(Config);

Config.directives = {
  BlackList: { parameter: 'blacklist', type: 'list' },
  WhiteList: { parameter: 'whitelst', type: 'list' },
  HighlightedCategories: { parameter: 'highlightcats', type: 'list' },
  SortThreads: { parameter: 'sortthreads', type: 'single' }
};

Config.init = function () {
  forEach(Config.directives, function (directive, obj) {
    if (obj.type != 'list') return;
    Config['addTo' + directive] = function (value) {
      Config.setValue(directive, value, Config.confirmReload);
    };
    Config['removeFrom' + directive] = function (value) {
      Config.removeValue(directive, value, Config.confirmReload);
    };
  });
};

Config.sendUserConfAction = function (action, directive, value, handler) {
  var obj = Config.directives[directive];
  if (!obj) return;
  var url =
    window.userconf_uri +
    '?a=' + action +
    '&directive=' + directive +
    '&' + obj.parameter + '=' + encodeURIComponent(value) +
    (obj.type == 'list' ? '&type=stringlist' : '') +
    '&unique=' + new Date().getTime();
  var xhr = new XMLHttpRequest();
  xhr.open('GET', url);
  if (handler) {
    xhr.onload = handler;
  }
  xhr.send();
};

Config.setValue = Config.sendUserConfAction.bind(null, 'setvalue');
Config.removeValue = Config.sendUserConfAction.bind(null, 'removevalue');

Config.confirmReload = function () {
  var reloadDialog = 'Die Einstellung wurde auf dem Server gespeichert. Soll die Forumshauptseite jetzt neu geladen werden?';
  if (window.confirm(reloadDialog)) {
    location.reload(true);
  }
};

// ####################################################################################

// Statistiken

var Stats = {};
Modules.add(Stats);

Stats.documentType = 'hauptseite';

Stats.init = function () {
  Stats.currentRanking = null;
  Stats.createRankings();
};

Stats.createRankings = function () {
  Stats.authorRanking = Stats.createRanking(Forum.postingsByAuthor);
  Stats.categoryRanking = Stats.createRanking(Forum.postingsByCategory);
};

Stats.createRanking = function (postings) {
  var ranking = [];

  forEach(postings, function (name, postings) {
    ranking.push({
      name: name,
      postingNumber: postings.length
    });
  });

  ranking.sort(function (a, b) {
    return b.postingNumber - a.postingNumber;
  });

  return ranking;
};

Stats.show = function (type) {
  Stats.currentType = type;
  Menu.hide();
  var ranking = Stats[type + 'Ranking'];

  var html = '<p class="hide"><a href="" class="hide">Statistik schließen</a></p>';
  html += '<table>';
  ranking.forEach(function (entry) {
    html +=
      '<tr><th><a href="">' +
      escapeHTML(entry.name) +
      '</th><td>' +
      entry.postingNumber +
      '</td></tr>';
  });
  html += '</table>';

  var layer = createLayer({
    id: 'stats',
    className: type + 'Stats'
  });
  layer.element.addEventListener('click', Stats.click);
  layer.html(html).show();
};

Stats.click = function (event) {
  var target = event.target;
  if (target.tagName != 'A') return;
  event.preventDefault();
  Stats.hide();
  if (target.classList.contains('hide')) return;
  var filter;
  if (Stats.currentType == 'author') {
    filter = Filter.filterByAuthor;
  } else if (Stats.currentType == 'category') {
    filter = Filter.filterByCategory;
  }
  if (filter) {
    filter(target.textContent);
  }
};

Stats.hide = function () {
  getLayer('stats').remove();
};

// ####################################################################################

var Sorting = {};
Modules.add(Sorting);

Sorting.documentType = 'hauptseite';

Sorting.init = function () {
  var
    parentId = 'beschreibung',
    parent = document.getElementById(parentId);
  if (!parent) return;
  var elem = document.createElement('div');
  elem.id = 'change-thread-sorting';
  elem.innerHTML =
    '<h2>Sortierung der Threads:</h2>' +
    '<ul>' +
    '<li><label><input type="radio" name="sorting" value="newestfirst"> Nach jüngstem Posting (Standard)</label></li>' +
    '<li><label><input type="radio" name="sorting" value="descending"> Absteigend</label></li>' +
    '<li><label><input type="radio" name="sorting" value="ascending"> Aufsteigend</label></li>' +
    '</ul>';
  elem.addEventListener('click', Sorting.change);
  parent.appendChild(elem);
};

Sorting.change = function (event) {
  var
    target = event.target,
    targetName = target.nodeName.toLowerCase();
  if (targetName != 'input') {
    return;
  }
  event.stopPropagation();
  Config.setValue('SortThreads', target.value, Config.confirmReload);
};

// ####################################################################################

})();