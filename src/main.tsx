import ReactDOM from "react-dom/client";import App from "./App";
import { BrowserRouter } from "react-router";
import { ToastContainer } from "react-toastify";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
    <ToastContainer />
    <App />
  </BrowserRouter>
);
