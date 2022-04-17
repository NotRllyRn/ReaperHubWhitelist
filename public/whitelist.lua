local Incoming = { ... }
local client = game:GetService("Players").LocalPlayer
if not client then
    return warn('wtf where is your player?')
end
if not Incoming[1] or not Incoming[2] then
	return client:Kick("[ERROR] do not change the script lol.")
else
	local key = Incoming[1]
	local uuid = Incoming[2]

	local request = syn and syn.request or http_request or request
	local httpservice = game:GetService("HttpService")
	if not request or not httpservice then
		return client:Kick("[ERROR] unsupported executor.")
	else
		local success, body = pcall(function()
			return httpservice:JSONDecode(request({
				Url = "https://reaperhub.herokuapp.com/add/",
				Method = "POST",
				Headers = {
					["Content-Type"] = "application/json",
				},
				Body = httpservice:JSONEncode({
					["key"] = key,
					["uuid"] = uuid,
				}),
			}).Body)
		end)

		if not success then
            return client:Kick("[ERROR] " .. body)
        elseif body.error then
            return client:Kick("[ERROR] " .. body.error)
        else
            return client:Kick("[Whitelist] " .. body.message)
        end 
	end
end
