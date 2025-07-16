// src/main.jsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

// Components & Pages
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import MainLayout from './components/layout/MainLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardRedirect from './components/auth/DashboardRedirect.jsx';
import CategoryPage from './pages/CategoryPage.jsx';
import BrandPage from './pages/BrandPage.jsx';
import CustomerPage from './pages/CustomerPage.jsx'
import SalePage from './pages/SalePage.jsx';
import CreateSalePage from './pages/CreateSalePage.jsx';
import SaleDetailPage from './pages/SaleDetailPage.jsx';
import ProductModelPage from './pages/ProductModelPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import UserManagementPage from './pages/UserManagementPage.jsx';
import EditSalePage from './pages/EditSalePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ChangePasswordPage from './pages/ChangePasswordPage.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/login',
        element: <LoginPage />
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <MainLayout />,
            children: [
              {
                path: 'dashboard',
                element: <DashboardRedirect />
              },
              {
                path: 'inventory',
                element: <InventoryPage />
              },
              {
                path: 'users',
                element: <UserManagementPage />
              },
              {
                path: 'brands',
                element: <BrandPage />
              },
              {
                path: 'categories',
                element: <CategoryPage />
              },
              {
                path: 'customers',
                element: <CustomerPage />
              },
              {
                path: 'sales',
                element: <SalePage />
              },
              {
                path: 'sales/new',
                element: <CreateSalePage />
              },
              {
                path: 'sales/:saleId',
                element: <SaleDetailPage />
              },
              {
                path: 'sales/edit/:saleId',
                element: <EditSalePage />
              },
              {
                path: 'product-models',
                element: <ProductModelPage />
              },
              {
                path: 'profile',
                element: <ProfilePage />
              },
            ]
          }
        ]
      }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)