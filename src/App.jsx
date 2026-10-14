import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import BookForm from "./components/BookForm.jsx";
import BookPage from "./components/BookPage.jsx";
import Door from "./components/Door.jsx";
import SearchPage from "./components/SearchPage.jsx";
import Shelf from "./components/Shelf.jsx";
import { AuthProvider } from "./auth.jsx";
import { LibraryProvider } from "./library.jsx";

export default function App() {
  return (
    <AuthProvider>
      <LibraryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Door />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/read" element={<Shelf status="read" />} />
          <Route path="/tbr" element={<Shelf status="tbr" />} />
          <Route path="/book/:id" element={<BookPage />} />
          <Route path="/book/:id/edit" element={<BookForm mode="edit" />} />
          <Route path="/book/:id/finish" element={<BookForm mode="finish" />} />
          <Route path="/new/:status" element={<BookForm mode="add" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </LibraryProvider>
    </AuthProvider>
  );
}
