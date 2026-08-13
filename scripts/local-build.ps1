$ErrorActionPreference = "Stop"
$env:LOCAL_BASE_PATH = "1"
$env:NEXT_PUBLIC_APP_BASE_PATH = "/japanese"
npx vinext build
