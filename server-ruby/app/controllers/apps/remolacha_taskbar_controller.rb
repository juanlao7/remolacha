class Apps::RemolachaTaskbarController < ApplicationController
  def getCurrentTime
	json_response({
	  'timestamp': DateTime.now.strftime('%Q'),
	  'utcOffset': Time.now.utc_offset * 1000,
	  'zone': Time.now.zone
	})
  end
end
