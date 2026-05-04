/** يمنع وميض المظهر قبل hydration */
export function ThemeScript() {
  const code = `(function(){try{var k='amarati-theme';var t=localStorage.getItem(k);var d=document.documentElement;var mq=window.matchMedia('(prefers-color-scheme: dark)');if(t==='dark'){d.classList.add('dark');}else if(t==='light'){d.classList.remove('dark');}else if(mq.matches){d.classList.add('dark');}else{d.classList.remove('dark');}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}
