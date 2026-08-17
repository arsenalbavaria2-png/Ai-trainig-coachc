import { Outlet } from 'react-router-dom';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Outlet />
    </div>
  );
};

export default AppLayout;
