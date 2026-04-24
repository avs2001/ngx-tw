import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTheme } from 'ngx-tw/theme';
import { provideTwDialog } from 'ngx-tw/dialog';
import { provideToast } from 'ngx-tw/toast';
import { provideNativeDateAdapter } from 'ngx-tw/calendar';
import { provideTwLucideIcons } from 'ngx-tw/icon/lucide';
import {
  Star, Heart, CheckCircle, AlertTriangle, Info,
  XCircle, Settings, Search, User, Mail,
  Bell, Home, ArrowRight, Download, Upload,
  Edit, Trash2, Eye, Lock, Unlock,
  ArrowDownWideNarrow, Calendar, ChevronRight, FileText,
  Package, PlayCircle, MessageSquare, LayoutTemplate,
  Layers, FlipHorizontal2,
} from 'lucide-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideTheme(),
    provideTwDialog(),
    provideToast({ position: 'bottom-right', duration: 4000 }),
    provideNativeDateAdapter(),
    provideTwLucideIcons({
      Star, Heart, CheckCircle, AlertTriangle, Info,
      XCircle, Settings, Search, User, Mail,
      Bell, Home, ArrowRight, Download, Upload,
      Edit, Trash2, Eye, Lock, Unlock,
      ArrowDownWideNarrow, Calendar, ChevronRight, FileText,
      Package, PlayCircle, MessageSquare, LayoutTemplate,
      Layers, FlipHorizontal2,
    }),
  ]
};
