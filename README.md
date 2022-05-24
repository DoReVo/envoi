# What does it do
- Accept HTTP request (dynamic url)
- Forward that HTTP request to 1 or more destinations
- Everything is configurable

# Configuration
Look at `example.config.json`
- `uri` is the endpoint to accept HTTP request
- `forwardTo` is an array of endpoints of destination to forward the HTTP request to
- `type` is used to handle HTTP request that requires respond such as webhook validation
- `tags` are not used, its simply to tell you what is that particular entry about

# Deployment
1. Run `go build`
2. Copy systemd unit file `example.envoi.service` to `/etc/systemd/system`
3. Configure unit file accordingly
4. Copy `example.config.json` and rename to `config.json`
5. Configure `config.json` accordinngly

IMPORTANT: Make sure `envoi` binary file is in the same directory as `config.json`