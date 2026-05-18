import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/api/axiosConfig";
import { Bell, Globe, Sun, Moon, LogOut, Menu } from "lucide-react";
import { setTheme, toggleMobileSidebar } from "../../redux/features/uiSlice";
import { cn } from "@/lib/utils";
import DynamicBreadcrumb from "./DynamicBreadcrumb";

export default function Topbar() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language.toUpperCase();
  const [openLang, setOpenLang] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useSelector((s) => s.ui.theme);
  const user = useSelector((s) => s.auth.user);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const handleLogout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.log('Logout API error (normal):', error);
    }
    dispatch({ type: 'auth/logoutSuccess' });
    navigate("/login", { replace: true });
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6 shadow-sm">
      <div className="flex items-center gap-3 flex-1">
        <button
          onClick={() => dispatch(toggleMobileSidebar())}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-base md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex-1 hidden md:block">
          <DynamicBreadcrumb />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setOpenLang(!openLang)}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-base"
            aria-label="Select language"
          >
            <span className="font-semibold">{currentLang}</span>
          </button>
          {openLang && (
            <div className="absolute right-0 top-full mt-1 w-32 rounded-md border bg-background shadow-lg z-50">
              <button
                onClick={() => {
                  i18n.changeLanguage('en');
                  setOpenLang(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-t"
              >
                English
              </button>
              <button
                onClick={() => {
                  i18n.changeLanguage('am');
                  setOpenLang(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
              >
                አማርኛ
              </button>
              <button
                onClick={() => {
                  i18n.changeLanguage('ti');
                  setOpenLang(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
              >
                ትግርኛ
              </button>
              <button
                onClick={() => {
                  i18n.changeLanguage('om');
                  setOpenLang(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted rounded-b"
              >
                Afaan Oromoo
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => dispatch(setTheme(theme === "dark" ? "light" : "dark"))}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-base"
          aria-label={t('topbar.theme')}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-base"
          aria-label={t('general.notifications')}
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </button>
        <div className="ml-2 flex items-center gap-3 border-l border-border pl-4">
          <img src="/image.png" alt="Logo" className="h-7 w-7 rounded-full object-cover" />
          <div className="hidden flex-col leading-tight md:flex">
            <span className="text-sm font-medium text-foreground">{user?.firstName || user?.email}</span>
            {/* <span className="text-xs text-muted-foreground">{user?.isSuperUser ? 'SuperUser' : 'User'}</span> */}
            <span className="text-xs text-muted-foreground">{user?.isSuperUser ? 'SuperUser':user?.roles[0]?.name||'User'}</span>

          </div>
          <button
            onClick={handleLogout}
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-base"
            aria-label={t('general.logout')}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
