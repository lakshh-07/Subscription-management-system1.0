import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './Layout'
import {
  Dashboard, Customers, Plans, Subscriptions,
  BillingPreview, Invoices, InvoiceDetail,
} from './Pages'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/billing-preview" element={<BillingPreview />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
      </Route>
    </Routes>
  )
}