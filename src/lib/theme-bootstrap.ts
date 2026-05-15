/** يُنفَّذ في أول HTML: يقرأ `amarati-theme` من localStorage — فاتح أو داكن فقط (لا وضع «نظام»). */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){try{var k='amarati-theme';var t=localStorage.getItem(k);var d=document.documentElement;if(t==='dark'){d.classList.add('dark');}else{d.classList.remove('dark');}}catch(e){}})();`;
