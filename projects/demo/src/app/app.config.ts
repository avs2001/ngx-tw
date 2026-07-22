import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTheme } from '@cdevhub/ngx-tw/theme';
import { provideTwDialog } from '@cdevhub/ngx-tw/dialog';
import { provideSheet } from '@cdevhub/ngx-tw/sheet';
import { provideToast } from '@cdevhub/ngx-tw/toast';
import { provideNativeDateAdapter } from '@cdevhub/ngx-tw/calendar';
import { provideTwLucideIcons } from '@cdevhub/ngx-tw/icon/lucide';
import {
  Star, Heart, CheckCircle, AlertTriangle, Info,
  XCircle, Settings, Search, User, Mail,
  Bell, Home, ArrowRight, Download, Upload,
  Edit, Trash2, Eye, Lock, Unlock,
  ArrowDownWideNarrow, Calendar, ChevronRight, ChevronDown, FileText,
  Package, PlayCircle, MessageSquare, LayoutTemplate,
  Layers, FlipHorizontal2, Inbox, Slash,
  UploadCloud, Image, File, X,
  ListTree, Folder,
} from 'lucide-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideTheme(),
    provideTwDialog(),
    provideSheet(),
    provideToast({ position: 'bottom-right', duration: 4000 }),
    provideNativeDateAdapter(),
    provideTwLucideIcons({
      Star, Heart, CheckCircle, AlertTriangle, Info,
      XCircle, Settings, Search, User, Mail,
      Bell, Home, ArrowRight, Download, Upload,
      Edit, Trash2, Eye, Lock, Unlock,
      ArrowDownWideNarrow, Calendar, ChevronRight, ChevronDown, FileText,
      Package, PlayCircle, MessageSquare, LayoutTemplate,
      Layers, FlipHorizontal2, Inbox, Slash,
      UploadCloud, Image, File, X,
      ListTree, Folder,
    }),
  ]
};
