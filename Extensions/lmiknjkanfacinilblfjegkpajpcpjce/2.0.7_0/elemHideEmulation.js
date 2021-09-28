if("function"!=typeof require){var require=function(a){if(!(a in require.scopes)){let b={exports:{}};require.scopes[a]=require.modules[a](b,b.exports)}return require.scopes[a]};require.modules=Object.create(null),require.scopes=Object.create(null)}require.modules.common=function(a,b){"use strict";return b.filterToRegExp=function(a){return a.replace(/\*+/g,"*").replace(/\^\|$/,"^").replace(/\W/g,"\\$&").replace(/\\\*/g,".*").replace(/\\\^/g,"(?:[\\x00-\\x24\\x26-\\x2C\\x2F\\x3A-\\x40\\x5B-\\x5E\\x60\\x7B-\\x7F]|$)").replace(/^\\\|\\\|/,"^[\\w\\-]+:\\/+(?!\\/)(?:[^\\/]+\\.)?").replace(/^\\\|/,"^").replace(/\\\|$/,"$").replace(/^(\.\*)/,"").replace(/(\.\*)$/,"")},b.splitSelector=function(a){var b=Math.max;if(-1==a.indexOf(","))return[a];let c=[],d=0,e=0,f="";for(let g,h=0;h<a.length;h++)g=a[h],"\\"==g?h++:g==f?f="":""==f&&("\""==g||"'"==g?f=g:"("==g?e++:")"==g?e=b(0,e-1):","==g&&0==e&&(c.push(a.substring(d,h)),d=h+1));return c.push(a.substring(d)),c},a.exports},require.modules.content_elemHideEmulation=function(a,b){"use strict";function c(a){let{children:b}=a.parentNode;for(let c=0;c<b.length;c++)if(b[c]==a)return c+1;return 0}function d(a,b){if(null==a)return null;if(!a.parentElement){let a=":root";return b&&(a+=" > "+b),a}let e=c(a);if(0<e){let c=`${a.tagName}:nth-child(${e})`;return b&&(c+=" > "+b),d(a.parentElement,c)}return b}function e(a,b){let d=1,e=null,f=b;for(;f<a.length;f++){let b=a[f];if("\\"==b)f++;else if(e)b==e&&(e=null);else if("'"==b||"\""==b)e=b;else if("("==b)d++;else if(")"==b&&(d--,0==d))break}return 0<d?null:{text:a.substring(b,f),end:f}}function f(a){let b=[];for(let c=0;c<a.style.length;c++){let d=a.style.item(c),e=a.style.getPropertyValue(d),f=a.style.getPropertyPriority(d);b.push(`${d}: ${e}${f?" !"+f:""};`)}return b.sort(),{style:b.join(" "),subSelectors:o(a.selectorText)}}function*g(a,b,c,d,e){if(b>=a.length)return void(yield c);for(let[f,h]of a[b].getSelectors(c,d,e))null==f?yield null:yield*g(a,b+1,f,h,e);yield null}function h(a){this._selector=a}function i(a){this._innerSelectors=a}function j(a){this._text=a}function k(a){let b;b=2<=a.length&&"/"==a[0]&&"/"==a[a.length-1]?a.slice(1,-1).replace("\\x7B ","{").replace("\\x7D ","}"):n(a),this._regexp=new RegExp(b,"i")}function l(a){return a.selectors.some(a=>a.preferHideWithSelector)&&!a.selectors.some(a=>a.requiresHiding)}function m(a,b,c,d){this.window=a,this.getFiltersFunc=b,this.addSelectorsFunc=c,this.hideElemsFunc=d,this.observer=new a.MutationObserver(this.observe.bind(this))}const{filterToRegExp:n,splitSelector:o}=require("common");let p=3e3;const q=/:-abp-([\w-]+)\(/i;h.prototype={*getSelectors(a,b,c){yield[a+this._selector,b]}};const r=/[\s>+~]$/,s=/^[>+~]/;return i.prototype={requiresHiding:!0,get dependsOnStyles(){return this._innerSelectors.some(a=>a.dependsOnStyles)},*getSelectors(a,b,c){for(let e of this.getElements(a,b,c))yield[d(e,""),e]},*getElements(a,b,c){let d=!a||r.test(a)?a+"*":a,e=b.querySelectorAll(d);for(let d of e){let a=g(this._innerSelectors,0,"",d,c);for(let b of a){if(null==b){yield null;continue}s.test(b)&&(b=":scope"+b);try{d.querySelector(b)&&(yield d)}catch(a){}}yield null}}},j.prototype={requiresHiding:!0,*getSelectors(a,b,c){for(let e of this.getElements(a,b,c))yield[d(e,""),b]},*getElements(a,b,c){let d=!a||r.test(a)?a+"*":a,e=b.querySelectorAll(d);for(let d of e)d.textContent.includes(this._text)?yield d:yield null}},k.prototype={preferHideWithSelector:!0,dependsOnStyles:!0,*findPropsSelectors(a,b,c){for(let d of a)if(c.test(d.style))for(let a of d.subSelectors){a.startsWith("*")&&!r.test(b)&&(a=a.substr(1));let c=a.lastIndexOf("::");-1!=c&&(a=a.substr(0,c)),yield b+a}},*getSelectors(a,b,c){for(let d of this.findPropsSelectors(c,a,this._regexp))yield[d,b]}},m.prototype={isSameOrigin(a){try{return new URL(a.href).origin==this.window.location.origin}catch(a){return!0}},parseSelector(a){if(0==a.length)return[];let b=q.exec(a);if(!b)return[new h(a)];let c=[];0<b.index&&c.push(new h(a.substr(0,b.index)));let d=b.index+b[0].length,f=e(a,d);if(!f)return this.window.console.error(new SyntaxError("Failed to parse Adblock Plus "+`selector ${a} `+"due to unmatched parentheses.")),null;if("properties"==b[1])c.push(new k(f.text));else if("has"==b[1]){let a=this.parseSelector(f.text);if(null==a)return null;c.push(new i(a))}else if("contains"==b[1])c.push(new j(f.text));else return this.window.console.error(new SyntaxError("Failed to parse Adblock Plus "+`selector ${a}, invalid `+`pseudo-class :-abp-${b[1]}().`)),null;let g=this.parseSelector(a.substr(f.end+1));return null==g?null:(c.push(...g),1==c.length&&c[0]instanceof j?(this.window.console.error(new SyntaxError("Failed to parse Adblock Plus "+`selector ${a}, can't `+"have a lonely :-abp-contains().")),null):c)},_addSelectors(a,b){let c=[],d=[],e=[],h=[],i=[],j=!!a;a||(a=this.window.document.styleSheets);for(let c,d=0;d<a.length;d++){if(c=a[d],!this.isSameOrigin(c))continue;let b=c.cssRules;if(b)for(let a of b)a.type==a.STYLE_RULE&&i.push(f(a))}let{document:k}=this.window,m=this.patterns.slice(),n=null,o=null,p=()=>{let a=this.window.performance.now();if(!n){if(!m.length)return this.addSelectorsFunc(c,d),this.hideElemsFunc(e,h),void("function"==typeof b&&b());if(n=m.shift(),j&&!n.selectors.some(a=>a.dependsOnStyles))return n=null,p();o=g(n.selectors,0,"",k,i)}for(let b of o){if(null!=b)if(l(n))c.push(b),d.push(n.text);else for(let a of k.querySelectorAll(b))e.push(a),h.push(n.text);if(this.window.performance.now()-a>50)return void this.window.setTimeout(p,0)}return n=null,p()};p()},get MIN_INVOCATION_INTERVAL(){return p},set MIN_INVOCATION_INTERVAL(a){p=a},_filteringInProgress:!1,_lastInvocation:-p,_scheduledProcessing:null,queueFiltering(a){let b=()=>{if(this._lastInvocation=this.window.performance.now(),this._filteringInProgress=!1,this._scheduledProcessing){let a=this._scheduledProcessing.stylesheets;this._scheduledProcessing=null,this.queueFiltering(a)}};this._scheduledProcessing?a?this._scheduledProcessing.stylesheets&&this._scheduledProcessing.stylesheets.push(...a):this._scheduledProcessing.stylesheets=null:this._filteringInProgress?this._scheduledProcessing={stylesheets:a}:this.window.performance.now()-this._lastInvocation<p?(this._scheduledProcessing={stylesheets:a},this.window.setTimeout(()=>{let a=this._scheduledProcessing.stylesheets;this._filteringInProgress=!0,this._scheduledProcessing=null,this._addSelectors(a,b)},p-(this.window.performance.now()-this._lastInvocation))):(this._filteringInProgress=!0,this._addSelectors(a,b))},onLoad(a){let b=a.target.sheet;b&&this.queueFiltering([b])},observe(a){this.queueFiltering()},apply(){this.getFiltersFunc(a=>{this.patterns=[];for(let b of a){let a=this.parseSelector(b.selector);null!=a&&0<a.length&&this.patterns.push({selectors:a,text:b.text})}if(0<this.patterns.length){let{document:a}=this.window;this.queueFiltering(),this.observer.observe(a,{childList:!0,attributes:!0,characterData:!0,subtree:!0}),a.addEventListener("load",this.onLoad.bind(this),!0)}})}},b.ElemHideEmulation=m,a.exports};