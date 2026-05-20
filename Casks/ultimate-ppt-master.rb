cask "ultimate-ppt-master" do
  arch arm: "arm64", intel: "x64"

  version "2.1.0"
  sha256 :no_check

  url "https://github.com/kdnsna/ultimate-ppt-master-skill/releases/download/v#{version}/Ultimate-PPT-Master-#{version}-macOS-#{arch}.zip",
      verified: "github.com/kdnsna/ultimate-ppt-master-skill/"
  name "Ultimate PPT Master"
  name "终极融合 PPT 大师"
  desc "Local-first AI PPT desktop app for editable PowerPoint and Web Decks"
  homepage "https://github.com/kdnsna/ultimate-ppt-master-skill"

  livecheck do
    url :url
    strategy :github_latest
  end

  depends_on macos: ">= :ventura"

  app "终极融合 PPT 大师.app"

  zap trash: [
    "~/.ppt-master",
    "~/Library/Application Support/com.kdnsna.ultimate-ppt-master",
    "~/Library/Caches/com.kdnsna.ultimate-ppt-master",
    "~/Library/Logs/com.kdnsna.ultimate-ppt-master",
    "~/Library/Preferences/com.kdnsna.ultimate-ppt-master.plist",
    "~/Library/Saved Application State/com.kdnsna.ultimate-ppt-master.savedState",
  ]
end
