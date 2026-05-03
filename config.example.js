// 사용법: 이 파일을 config.js로 복사한 뒤 본인 Supabase 프로젝트 값으로 교체
// (docs/supabase-setup.md A-2 단계 참고). 교체 후 chrome://extensions 새로고침.
(function (g) {
  g.VocaConfig = {
    SUPABASE_URL: "https://YOUR-PROJECT-REF.supabase.co",
    SUPABASE_ANON_KEY: "YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY",
  };
})(typeof self !== "undefined" ? self : this);
