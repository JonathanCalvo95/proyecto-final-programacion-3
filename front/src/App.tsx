import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom'
import { AuthProvider } from './components/AuthProvider';
import Login from './Login';
import { Home } from './modules/home'
import { Layout } from './modules/layout'
import { NotFound } from './modules/notFound'

export const App = () => {
  return(
  <div className="App">
    <BrowserRouter>
      <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />     
        <Route element={<Layout />}> 
          <Route path="/" element={<Home />} /> 
          <Route path="*" element={<NotFound />} /> 
        </Route>
      </Routes>
      </AuthProvider>
    </BrowserRouter>
  </div>
);
};