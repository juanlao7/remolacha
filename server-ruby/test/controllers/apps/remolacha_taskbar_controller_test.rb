require "test_helper"

class Apps::RemolachaTaskbarControllerTest < ActionDispatch::IntegrationTest
  test "should get getCurrentTime" do
    get apps_remolacha_taskbar_getCurrentTime_url
    assert_response :success
  end
end
