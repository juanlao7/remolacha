Rails.application.routes.draw do
  namespace :apps do
    get 'remolacha.Taskbar/getCurrentTime', to: 'remolacha_taskbar#getCurrentTime'
  end
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
end
