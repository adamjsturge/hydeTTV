# make bump             1.1.1 -> 1.1.2 in both manifests
# make bump PART=minor  1.1.1 -> 1.2.0 (PART=major: 1.1.1 -> 2.0.0)
# make build            store zips in dist/ (see build.sh)
# make release          bump, then build

PART ?= patch

.PHONY: bump build release

bump:
	@version=$$(jq -r .version manifest.json); \
	firefox_version=$$(jq -r .version manifest.firefox.json); \
	if [ "$$version" != "$$firefox_version" ]; then \
		echo "Version mismatch: manifest.json is $$version," \
			"manifest.firefox.json is $$firefox_version" >&2; \
		exit 1; \
	fi; \
	major=$${version%%.*}; rest=$${version#*.}; \
	minor=$${rest%%.*}; patch=$${rest#*.}; \
	case "$(PART)" in \
		major) new="$$((major + 1)).0.0" ;; \
		minor) new="$$major.$$((minor + 1)).0" ;; \
		patch) new="$$major.$$minor.$$((patch + 1))" ;; \
		*) echo "PART must be major, minor or patch" >&2; exit 1 ;; \
	esac; \
	for f in manifest.json manifest.firefox.json; do \
		sed -i.bak "s/\"version\": \"$$version\"/\"version\": \"$$new\"/" $$f; \
		rm $$f.bak; \
	done; \
	echo "Bumped $$version -> $$new"

build:
	./build.sh

release: bump
	./build.sh
