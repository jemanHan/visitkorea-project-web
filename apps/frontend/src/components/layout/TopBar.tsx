import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { isAuthenticated, logout } from "../../api/auth.js";

export default function TopBar() {
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const authenticated = isAuthenticated();

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b">
      <div className="container mx-auto px-4 py-3 flex items-center gap-3">
        <Link to="/" className="text-xl font-bold">VisitKorea</Link>
        <div className="flex-1">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const query = q.trim();
              if (query) nav(`/?q=${encodeURIComponent(query)}`);
              else nav(`/`);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="어디로 떠나볼까요?"
              className="input input-bordered w-full"
            />
            <button className="btn btn-primary" type="submit">검색</button>
          </form>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/together" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
            함께하기
          </Link>
          <Link to="/schedule" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
            스케줄
          </Link>
          <Link to="/mypage" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
            마이페이지
          </Link>
          {authenticated ? (
            <button
              onClick={logout}
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              로그아웃
            </button>
          ) : (
            <Link to="/login" className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors">
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
