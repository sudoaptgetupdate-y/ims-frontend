// src/main.jsx

import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

// Components
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import MainLayout from './components/layout/MainLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';

// Lazy load all the pages
const DashboardRedirect = lazy(() => import('./components/auth/DashboardRedirect.jsx'));
const InventoryPage = lazy(() => import('./pages/InventoryPage.jsx'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage.jsx'));
const BrandPage = lazy(() => import('./pages/BrandPage.jsx'));
const CategoryPage = lazy(() => import('./pages/CategoryPage.jsx'));
const CustomerPage = lazy(() => import('./pages/CustomerPage.jsx'));
const CustomerHistoryPage = lazy(() => import('./pages/CustomerHistoryPage.jsx'));
const ActiveBorrowingsPage = lazy(() => import('./pages/ActiveBorrowingsPage.jsx'));
const CustomerReturnedHistoryPage = lazy(() => import('./pages/CustomerReturnedHistoryPage.jsx'));
const CustomerPurchaseHistoryPage = lazy(() => import('./pages/CustomerPurchaseHistoryPage.jsx'));
const SalePage = lazy(() => import('./pages/SalePage.jsx'));
const CreateSalePage = lazy(() => import('./pages/CreateSalePage.jsx'));
const SaleDetailPage = lazy(() => import('./pages/SaleDetailPage.jsx'));
const EditSalePage = lazy(() => import('./pages/EditSalePage.jsx'));
const BorrowingPage = lazy(() => import('./pages/BorrowingPage.jsx'));
const CreateBorrowingPage = lazy(() => import('./pages/CreateBorrowingPage.jsx'));
const BorrowingDetailPage = lazy(() => import('./pages/BorrowingDetailPage.jsx'));
const ProductModelPage = lazy(() => import('./pages/ProductModelPage.jsx')); // --- เพิ่มบรรทัดนี้ ---
const ProfilePage = lazy(() => import('./pages/ProfilePage.jsx'));

// Fallback component to show while lazy components are loading
const Loading = () => (
  <div className="flex justify-center items-center h-[calc(100vh-100px)]">
    <p>Loading Page...</p>
  </div>
);

const routes = [
  { path: 'dashboard', Page: DashboardRedirect },
  { path: 'inventory', Page: InventoryPage },
  { path: 'users', Page: UserManagementPage },
  { path: 'brands', Page: BrandPage },
  { path: 'categories', Page: CategoryPage },
  { path: 'customers', Page: CustomerPage },
  { path: 'customers/:id/history', Page: CustomerHistoryPage },
  { path: 'customers/:id/active-borrowings', Page: ActiveBorrowingsPage },
  { path: 'customers/:id/returned-history', Page: CustomerReturnedHistoryPage },
  { path: 'customers/:id/purchase-history', Page: CustomerPurchaseHistoryPage },
  { path: 'sales', Page: SalePage },
  { path: 'sales/new', Page: CreateSalePage },
  { path: 'sales/:saleId', Page: SaleDetailPage },
  { path: 'sales/edit/:saleId', Page: EditSalePage },
  { path: 'borrowings', Page: BorrowingPage },
  { path: 'borrowings/new', Page: CreateBorrowingPage },
  { path: 'borrowings/:borrowingId', Page: BorrowingDetailPage },
  { path: 'product-models', Page: ProductModelPage }, // --- เพิ่มบรรทัดนี้ ---
  { path: 'profile', Page: ProfilePage },
];

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: 'login',
        element: <LoginPage />
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <MainLayout />,
            children: [
              { index: true, element: <Navigate to="/dashboard" replace /> },
              ...routes.map(({ path, Page }) => ({
                path,
                element: <Suspense fallback={<Loading />}><Page /></Suspense>,
              })),
            ]
          }
        ]
      }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);