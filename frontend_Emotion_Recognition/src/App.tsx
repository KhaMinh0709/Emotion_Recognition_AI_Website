import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { routes } from "./app/routes";
import DriveLeftSidebar from "./components/DriveLeftSidebar";
import ChatWidget from "./components/ChatWidget";
import FooterPape from "./components/FooterPape";

// xác định mục nào đang active để sidebar tô
function useActiveSidebarKey() {
  const { pathname } = useLocation();
  switch (pathname) {
    case "/":
      return "home";
    case "/dashboard":
      return "dashboard";
    case "/audio-sentiment":
      return "audio-sentiment";
    case "/vision-sentiment":
      return "vision-sentiment";    
    case "/max-fusion":
      return "max-fusion";    
    case "/trash":
      return "trash";  
    default:
      return "home";
  }
}

function Layout() {
  const navigate = useNavigate();
  const activeKey = useActiveSidebarKey();

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      {/* sidebar đứng im */}
      <DriveLeftSidebar
        active={activeKey}
        className="h-screen sticky top-0"
        onChange={(key) => {
          switch (key) {
            case "home":
              navigate("/");
              break;
            case "dashboard":
              navigate("/dashboard");
              break;  
            case "audio-sentiment":
              navigate("/audio-sentiment");
              break;
            case "vision-sentiment":
              navigate("/vision-sentiment");
              break;
            case "max-fusion":
              navigate("/max-fusion");
              break;
            case "trash":
              navigate("/trash");
              break;
            
            default:
              console.log("Chưa gán route:", key);
          }
        }}
      />

      {/* cột phải */}
      <div className="flex-1 h-screen overflow-hidden">
        {/* đây là vùng cuộn duy nhất */}
        <div className="h-full overflow-y-auto">
          {/* để đảm bảo footer luôn nằm sau nội dung */}
          <div className="min-h-full flex flex-col">
            {/* nội dung trang */}
            <main className="px-6 py-6">
              <Suspense fallback={<div>Đang tải...</div>}>
                <Routes>
                  {routes.map(({ path, element: Element }) => (
                    <Route key={path} path={path} element={<Element />} />
                  ))}
                </Routes>
              </Suspense>
            </main>

            {/* footer cuộn cùng, không bị che nữa */}
            <FooterPape />
          </div>
        </div>
      </div>

      {/* widget nổi */}
      <ChatWidget />
    </div>
  );
}
  
/**
 * App component
 * 
 * This component is the top-level component that renders the entire
 * application. It wraps the Layout component with the Router component
 * from react-router-dom to enable client-side routing.
 */
export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

