export default function Footer() {
  return (
    <footer className="mt-16 border-t">
      <div className="container mx-auto px-4 py-10 grid gap-6 md:grid-cols-4">
        <div>
          <div className="text-lg font-bold mb-2">VisitKorea</div>
          <p className="text-sm opacity-70">국내 여행 아이디어를 한 곳에서. 실습용 데모 UI.</p>
        </div>
        <div>
          <div className="font-semibold mb-2">바로가기</div>
          <ul className="space-y-1 text-sm">
            <li><a href="#recommended" className="hover:underline">추천</a></li>
            <li><a href="#regions" className="hover:underline">지역</a></li>
            <li><a href="#themes" className="hover:underline">카테고리</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">안내</div>
          <ul className="space-y-1 text-sm">
            <li><a className="hover:underline" href="#">이용약관</a></li>
            <li><a className="hover:underline" href="#">개인정보처리방침</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">고객센터</div>
          <p className="text-sm opacity-70">평일 09:00 ~ 18:00</p>
          <p className="text-sm opacity-70">support@example.com</p>
        </div>
      </div>
      <div className="text-xs opacity-60 text-center pb-6">© {new Date().getFullYear()} VisitKorea</div>
    </footer>
  );
}
