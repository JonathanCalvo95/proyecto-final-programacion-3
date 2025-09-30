import { Routes, Route, BrowserRouter } from 'react-router-dom'
import { Home } from './modules/home'
import { Layout } from './modules/layout'
import { NotFound } from './modules/notFound'

export const App = () => {
  return(
  <div className="App">
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </div>
);
};