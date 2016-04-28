!function(n){n(document).ready(function(){n(".listen-list-item").shuffle()}),n(window).load(function(){})}(jQuery),$.fn.shuffle=function(){var n=this.get(),t=function(n){return Math.floor(Math.random()*n)},e=$.map(n,function(){var e=t(n.length),i=$(n[e]).clone(!0)[0];return n.splice(e,1),i});return this.each(function(n){$(this).replaceWith($(e[n]))}),$(e)};
//# sourceMappingURL=default.js.map
