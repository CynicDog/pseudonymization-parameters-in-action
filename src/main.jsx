import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import {ParameterProvider} from "./Context.jsx";

createRoot(document.getElementById('root')).render(
    <ParameterProvider>
        <App />
    </ParameterProvider>
)
