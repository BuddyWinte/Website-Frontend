(function () {
  'use strict';

  var POLL_API = 'https://api.buddywinte.workers.dev';
  var VISITOR_API_BASE = 'https://visitor.6developer.com';

  var state = {
    visitor: { total: null, today: null, ready: false },
    poll: { question: '', options: {} },
    hasVoted: false,
    pollAnswer: '',
    pollErrorText: '',
    adsList: [],
    currentAd: null,
    adRotationInterval: null,
    blogPosts: null,
    blogPostsLoading: false
  };

  function $(id) {
    return document.getElementById(id);
  }

  function setVisible(el, visible) {
    if (!el) return;
    el.style.display = visible ? '' : 'none';
  }

  function setText(el, text) {
    if (!el) return;
    if (el.textContent !== undefined) el.textContent = text;
    else el.innerText = text;
  }

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function nowTs() {
    return new Date().getTime();
  }

  function httpRequest(method, url, body, headers, cb) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      cb(xhr.status, xhr.responseText, xhr);
    };
    if (headers) {
      var k;
      for (k in headers) {
        if (headers.hasOwnProperty(k)) xhr.setRequestHeader(k, headers[k]);
      }
    }
    xhr.send(body || null);
  }

  function getJson(url, cb) {
    httpRequest('GET', url, null, null, function (status, text) {
      if (status < 200 || status >= 300) return cb(new Error('HTTP ' + status));
      try {
        cb(null, JSON.parse(text));
      } catch (e) {
        cb(e);
      }
    });
  }

  function getText(url, cb) {
    httpRequest('GET', url, null, null, function (status, text) {
      if (status < 200 || status >= 300) return cb(new Error('HTTP ' + status));
      cb(null, text);
    });
  }

  function postJson(url, obj, cb) {
    httpRequest(
      'POST',
      url,
      JSON.stringify(obj),
      { 'Content-Type': 'application/json' },
      function (status, text) {
        if (status < 200 || status >= 300) return cb(new Error('HTTP ' + status), text);
        try {
          cb(null, JSON.parse(text));
        } catch (e) {
          cb(e);
        }
      }
    );
  }

  function parseQueryParamFromReferrer(referrer, hostNeedle, paramName) {
    if (!referrer) return '';
    if (referrer.indexOf(hostNeedle) === -1) return '';
    var qIndex = referrer.indexOf('?');
    if (qIndex === -1) return '';
    var query = referrer.substring(qIndex + 1);
    var parts = query.split('&');
    var i;
    for (i = 0; i < parts.length; i++) {
      var kv = parts[i].split('=');
      if (kv[0] === paramName) {
        try {
          return decodeURIComponent((kv[1] || '').replace(/\+/g, ' '));
        } catch (e) {
          return kv[1] || '';
        }
      }
    }
    return '';
  }

  function trackVisit(domain) {
    var page_path = window.location.pathname || '/';
    var page_title = document.title || '';
    var referrer = document.referrer || '';
    var timezone = '';
    try {
      if (window.Intl && Intl.DateTimeFormat) {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      }
    } catch (e) {
      timezone = '';
    }

    var search_query = '';
    search_query =
      parseQueryParamFromReferrer(referrer, 'google.', 'q') ||
      parseQueryParamFromReferrer(referrer, 'bing.com', 'q') ||
      parseQueryParamFromReferrer(referrer, 'yahoo.com', 'p') ||
      parseQueryParamFromReferrer(referrer, 'duckduckgo.com', 'q') ||
      '';

    postJson(
      VISITOR_API_BASE + '/visit',
      {
        domain: encodeURIComponent(domain),
        timezone: timezone,
        page_path: page_path,
        page_title: page_title,
        referrer: referrer,
        search_query: search_query
      },
      function (err, data) {
        if (err) return;
        state.visitor.total = data.totalCount;
        state.visitor.today = data.todayCount;
        state.visitor.ready = true;
        updateHomeVisitorCounts();
      }
    );
  }

  function getPercent(option) {
    var yes = state.poll.options.yes || 0;
    var no = state.poll.options.no || 0;
    var total = yes + no;
    if (total === 0) return 0;
    var count = state.poll.options[option] || 0;
    return Math.round((count / total) * 100);
  }

  function setPollError(text) {
    state.pollErrorText = text || '';
    var p = $('pollError');
    if (!p) return;
    if (state.pollErrorText) {
      setVisible(p, true);
      var small = p.getElementsByTagName('small')[0];
      if (small) setText(small, state.pollErrorText);
    } else {
      setVisible(p, false);
    }
  }

  function renderPollOptions() {
    var optionsEl = $('pollOptions');
    if (!optionsEl) return;
    optionsEl.innerHTML = '';

    var k;
    for (k in state.poll.options) {
      if (!state.poll.options.hasOwnProperty(k)) continue;
      var label = document.createElement('label');
      label.className = 'poll-option';

      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'site-poll';
      input.value = k;
      input.onclick = function () {
        state.pollAnswer = this.value;
        var voteBtn = $('pollVoteBtn');
        if (voteBtn) voteBtn.disabled = !state.pollAnswer;
      };

      var span = document.createElement('span');
      setText(span, k);

      label.appendChild(input);
      label.appendChild(span);
      optionsEl.appendChild(label);
    }
  }

  function renderPollVoted() {
    var votedEl = $('pollVoted');
    var formEl = $('pollForm');
    if (!votedEl || !formEl) return;

    if (!state.hasVoted) {
      setVisible(votedEl, false);
      setVisible(formEl, true);
      return;
    }

    setVisible(formEl, false);
    setVisible(votedEl, true);
    setText($('pollQuestionVoted'), state.poll.question || '');

    var list = $('pollResultsList');
    if (!list) return;
    list.innerHTML = '';

    var k;
    for (k in state.poll.options) {
      if (!state.poll.options.hasOwnProperty(k)) continue;
      var li = document.createElement('li');
      li.innerHTML = escapeHtml(k) + ' <b>(' + getPercent(k) + '%)</b>';
      list.appendChild(li);
    }
  }

  function getResults() {
    getJson(POLL_API + '/results?t=' + nowTs(), function (err, data) {
      if (err) {
        setPollError('could not load poll');
        return;
      }
      state.poll.question = data.question || '';
      state.poll.options = data.options || {};
      state.hasVoted = !!data.voted;

      setText($('pollQuestion'), state.poll.question || 'Loading poll...');
      renderPollOptions();
      renderPollVoted();
      setPollError('');

      var voteBtn = $('pollVoteBtn');
      if (voteBtn) voteBtn.disabled = !state.pollAnswer;
    });
  }

  function submitVote() {
    if (!state.pollAnswer) {
      setPollError('pick an option');
      return;
    }
    postJson(
      POLL_API + '/vote',
      { option: state.pollAnswer },
      function (err, dataOrText) {
        if (err) {
          setPollError('vote rejected / error');
          return;
        }
        state.poll.question = dataOrText.question || '';
        state.poll.options = dataOrText.options || {};
        state.hasVoted = !!dataOrText.voted;
        state.pollAnswer = '';
        setText($('pollQuestion'), state.poll.question || '');
        renderPollOptions();
        renderPollVoted();
        setPollError('');
        var voteBtn = $('pollVoteBtn');
        if (voteBtn) voteBtn.disabled = true;
      }
    );
  }

  function setAd(ad) {
    state.currentAd = ad;
    var box = $('nekoads');
    if (!box) return;
    if (!ad) {
      setVisible(box, false);
      return;
    }
    setVisible(box, true);
    var link = $('nekoadLink');
    var img = $('nekoadImg');
    var text = $('nekoadText');
    if (link) link.href = ad.websiteUrl || '#';
    if (img) {
      img.src = ad.adUrl || '';
      img.alt = 'Advertisement for ' + (ad.name || '');
    }
    if (text) setText(text, "Sponsored by '" + (ad.name || '') + "'");
  }

  function rotateAd() {
    if (!state.adsList || !state.adsList.length) return;
    var idx = Math.floor(Math.random() * state.adsList.length);
    setAd(state.adsList[idx]);
  }

  function loadAds() {
    var fallbackAds = [
      {
        name: 'buddywinte.xyz',
        websiteUrl: 'https://buddywinte.xyz/ads',
        adUrl: 'https://cdn.buddywinte.xyz/ads/imgs/placeholderAdvert.png'
      }
    ];

    getJson('https://cdn.buddywinte.xyz/ads/ads.json?t=' + nowTs(), function (err, ads) {
      if (err || !ads || !ads.length) {
        state.adsList = fallbackAds;
      } else {
        state.adsList = ads;
      }
      rotateAd();
      if (state.adRotationInterval) window.clearInterval(state.adRotationInterval);
      state.adRotationInterval = window.setInterval(rotateAd, 10000);
    });
  }

  function updateHomeVisitorCounts() {
    var today = state.visitor.today;
    var total = state.visitor.total;
    if (today === null || today === undefined) today = 0;
    if (total === null || total === undefined) total = 0;
    setText($('homeTodayCount'), String(today));
    setText($('homeTotalCount'), String(total));
  }

  function startYearsTimer() {
    var startDate = new Date(2019, 5, 27);
    if (state.yearsInterval) {
      window.clearInterval(state.yearsInterval);
      state.yearsInterval = null;
    }
    function update() {
      var now = new Date();
      var diff = now.getTime() - startDate.getTime();
      var years = diff / (1000 * 60 * 60 * 24 * 365.25);
      var el = $('homeYears');
      if (el) setText(el, years.toFixed(8));
    }
    update();
    state.yearsInterval = window.setInterval(update, 100);
  }

  function renderHome() {
    var view = $('routeView');
    if (!view) return;
    view.innerHTML =
      '<div class="content">' +
      '<img src="assets/home_banner.gif" alt="Welcome Banner" />' +
      '<p><b>Hello</b>! Thanks for checking out my website. I hope you enjoy your time here, and definitely check out my guestbook.</p>' +
      '<hr style="width: 50%; margin: 20px auto;">' +
      '<div class="home-split">' +
      '<div class="split-left" style="background-color: #ffffee;">' +
      '<img src="assets/aboutme.png" alt="ABOUT ME" />' +
      '<p><b>Bonjour!</b> <small>like my french?</small> I am BuddyWinte! I have been programming for almost <i><span id="homeYears">0.00</span></i> years. <br><br> I\\'ll probably add more here later, if I want to.</p>' +
      '</div>' +
      '<div class="split-right">' +
      '<p><span id="homeTodayCount">0</span> visitors today!</p>' +
      '<p><span id="homeTotalCount">0</span> total visitors!</p>' +
      '</div>' +
      '</div>' +
      '</div>';
    startYearsTimer();
    updateHomeVisitorCounts();
  }

  function renderExplore() {
    var view = $('routeView');
    if (!view) return;
    view.innerHTML =
      '<div class="content">' +
      '<div class="blog-page">' +
      '<h1>Explore</h1>' +
      '<p>this page isn\\'t made yet</p>' +
      '<hr />' +
      '<p>check back later!</p>' +
      '</div>' +
      '</div>';
  }

  function ensureBlogPosts(cb) {
    if (state.blogPosts) return cb(null, state.blogPosts);
    if (state.blogPostsLoading) {
      window.setTimeout(function () {
        ensureBlogPosts(cb);
      }, 100);
      return;
    }
    state.blogPostsLoading = true;
    if (window.BlogPosts) {
      state.blogPosts = window.BlogPosts;
      state.blogPostsLoading = false;
      cb(null, state.blogPosts);
      return;
    }
    getJson('https://cdn.buddywinte.xyz/blog/posts.json?t=' + nowTs(), function (err, posts) {
      state.blogPostsLoading = false;
      if (err) return cb(err);
      state.blogPosts = posts || [];
      cb(null, state.blogPosts);
    });
  }

  function renderBlog() {
    var view = $('routeView');
    if (!view) return;
    view.innerHTML =
      '<div class="blog-page">' +
      '<h1>BuddyWinte\\'s Blog</h1>' +
      '<p>super cool blog for me to post fun stuff on</p>' +
      '<hr />' +
      '<p id="blogLoading">Loading posts...</p>' +
      '<div id="blogList"></div>' +
      '</div>';

    ensureBlogPosts(function (err, posts) {
      var loading = $('blogLoading');
      if (loading) setVisible(loading, false);
      var list = $('blogList');
      if (!list) return;
      if (err) {
        list.innerHTML = '<p>Failed to load posts.</p>';
        return;
      }
      var html = '';
      var i;
      for (i = 0; i < posts.length; i++) {
        var p = posts[i];
        html +=
          '<div class="blog-post">' +
          '<p><b>' + escapeHtml(p.date || '') + '</b></p>' +
          '<p><b><a href="#/blog/' + encodeURIComponent(p.slug || '') + '">' + escapeHtml(p.title || '') + '</a></b></p>' +
          '<p>' + escapeHtml(p.preview || '') + '</p>' +
          '</div>';
      }
      list.innerHTML = html;
    });
  }

  function markdownInline(s) {
    var out = escapeHtml(s);
    out = out.replace(/\\[([^\\]]+)\\]\\(([^\\)]+)\\)/g, function (_, text, href) {
      return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + text + '</a>';
    });
    out = out.replace(/\\*\\*([^*]+)\\*\\*/g, '<b>$1</b>');
    out = out.replace(/\\*([^*]+)\\*/g, '<i>$1</i>');
    out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
    return out;
  }

  function renderMarkdown(md) {
    if (!md) return '';
    md = md.replace(/\\r\\n/g, '\\n').replace(/\\r/g, '\\n');

    var parts = md.split('```');
    var html = '';
    var i;
    for (i = 0; i < parts.length; i++) {
      var part = parts[i];
      if (i % 2 === 1) {
        var firstNewline = part.indexOf('\\n');
        var code = part;
        if (firstNewline !== -1) code = part.substring(firstNewline + 1);
        html += '<pre class="hljs"><code>' + escapeHtml(code) + '</code></pre>';
        continue;
      }

      var lines = part.split('\\n');
      var buffer = [];
      var l;
      for (l = 0; l < lines.length; l++) {
        var line = lines[l];
        if (line.indexOf('# ') === 0) {
          if (buffer.length) {
            html += '<p>' + markdownInline(buffer.join(' ')) + '</p>';
            buffer = [];
          }
          html += '<h1>' + markdownInline(line.substring(2)) + '</h1>';
        } else if (line.indexOf('## ') === 0) {
          if (buffer.length) {
            html += '<p>' + markdownInline(buffer.join(' ')) + '</p>';
            buffer = [];
          }
          html += '<h2>' + markdownInline(line.substring(3)) + '</h2>';
        } else if (line.indexOf('### ') === 0) {
          if (buffer.length) {
            html += '<p>' + markdownInline(buffer.join(' ')) + '</p>';
            buffer = [];
          }
          html += '<h3>' + markdownInline(line.substring(4)) + '</h3>';
        } else if (line.indexOf('>') === 0) {
          if (buffer.length) {
            html += '<p>' + markdownInline(buffer.join(' ')) + '</p>';
            buffer = [];
          }
          html += '<blockquote>' + markdownInline(line.replace(/^>\\s?/, '')) + '</blockquote>';
        } else if (/^\\s*$/.test(line)) {
          if (buffer.length) {
            html += '<p>' + markdownInline(buffer.join(' ')) + '</p>';
            buffer = [];
          }
        } else {
          buffer.push(line);
        }
      }
      if (buffer.length) html += '<p>' + markdownInline(buffer.join(' ')) + '</p>';
    }
    return html;
  }

  function renderBlogPost(slug) {
    var view = $('routeView');
    if (!view) return;
    view.innerHTML =
      '<div class="blog-page">' +
      '<p><a href="#/blog">back to blog</a></p>' +
      '<div id="postLoading"><p>Loading post...</p></div>' +
      '<div id="postError" style="display:none;"><p>Failed to load post. <a href="#/blog">Go back</a></p></div>' +
      '<div id="postOk" style="display:none;">' +
      '<h1 id="postTitle"></h1>' +
      '<p><b id="postDate"></b></p>' +
      '<hr />' +
      '<div id="postBody" class="markdown-body"></div>' +
      '</div>' +
      '<p><a href="#/blog">back to blog</a></p>' +
      '</div>';

    ensureBlogPosts(function (err, posts) {
      if (err) {
        setVisible($('postLoading'), false);
        setVisible($('postError'), true);
        return;
      }
      var i;
      var found = null;
      for (i = 0; i < posts.length; i++) {
        if (String(posts[i].slug) === String(slug)) {
          found = posts[i];
          break;
        }
      }
      if (!found || !found.file) {
        window.location.hash = '#/blog';
        return;
      }

      setText($('postTitle'), found.title || '');
      setText($('postDate'), found.date || '');

      getText(String(found.file) + '?t=' + nowTs(), function (err2, md) {
        setVisible($('postLoading'), false);
        if (err2) {
          setVisible($('postError'), true);
          return;
        }
        setVisible($('postOk'), true);
        var html = renderMarkdown(md);
        $('postBody').innerHTML = html;
        attachCopyButtons($('postBody'));
      });
    });
  }

  function attachCopyButtons(container) {
    if (!container) return;
    var pres = container.getElementsByTagName('pre');
    var i;
    for (i = 0; i < pres.length; i++) {
      var pre = pres[i];
      if (pre.getElementsByTagName('button').length) continue;
      var btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.type = 'button';
      btn.appendChild(document.createTextNode('copy'));
      btn.onclick = (function (preEl) {
        return function () {
          var codeEl = preEl.getElementsByTagName('code')[0];
          var text = codeEl ? (codeEl.innerText || codeEl.textContent || '') : (preEl.innerText || preEl.textContent || '');
          copyText(text);
        };
      })(pre);
      pre.style.position = 'relative';
      pre.appendChild(btn);
    }
  }

  function copyText(text) {
    if (window.clipboardData && window.clipboardData.setData) {
      try {
        window.clipboardData.setData('Text', text);
        return true;
      } catch (e) {}
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch (e2) {
      document.body.removeChild(ta);
      return false;
    }
  }

  function renderNekoadsPage() {
    var view = $('routeView');
    if (!view) return;
    view.innerHTML =
      '<div class="content">' +
      '<div class="blog-page">' +
      '<img src="assets/advertisment_header.png" alt="Advertisement" />' +
      '<p>adverts for your website, AND IT\\'S FREE!</p>' +
      '<hr />' +
      '<h1>this page isn\\'t made yet</h1>' +
      '</div>' +
      '</div>';
  }

  function normalizeHash(h) {
    if (!h) return '#/';
    if (h.indexOf('#') !== 0) h = '#' + h;
    if (h === '#') return '#/';
    if (h.indexOf('#/') !== 0) return '#/';
    return h;
  }

  function parseRoute(hash) {
    hash = normalizeHash(hash);
    var path = hash.substring(2);
    if (path === '') path = '/';
    var parts = path.split('/');
    if (parts.length && parts[0] === '') parts.shift();
    return parts;
  }

  function renderRoute() {
    var parts = parseRoute(window.location.hash);
    var main = $('mainContent');
    var blackLine = $('blackLine');
    var recent = $('recentNews');

    var isHome = parts.length === 0 || (parts.length === 1 && parts[0] === '');

    if (main) {
      if (isHome) main.className = 'main-content active';
      else main.className = 'main-content';
    }
    setVisible(blackLine, !isHome);
    setVisible(recent, isHome);

    if (isHome) {
      renderHome();
      return;
    }

    if (parts[0] === 'blog') {
      if (parts.length === 1) renderBlog();
      else renderBlogPost(decodeURIComponent(parts[1]));
      return;
    }

    if (parts[0] === 'nekoads' || parts[0] === 'ads') {
      renderNekoadsPage();
      return;
    }

    if (parts[0] === 'explore') {
      renderExplore();
      return;
    }

    window.location.hash = '#/';
  }

  function initPollUi() {
    var voteBtn = $('pollVoteBtn');
    var resultsBtn = $('pollResultsBtn');
    if (voteBtn) voteBtn.onclick = submitVote;
    if (resultsBtn) resultsBtn.onclick = getResults;
  }

  function init() {
    if (!window.location.hash) window.location.hash = '#/';
    initPollUi();
    getResults();
    loadAds();
    trackVisit('buddywinte.xyz');
    renderRoute();
    window.onhashchange = renderRoute;
  }

  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    window.attachEvent('onload', init);
  }
})();
