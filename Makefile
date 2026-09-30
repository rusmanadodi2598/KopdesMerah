# Makefile KopdesMerah — perintah standar pengembangan & instalasi.
# Pakai: make help

GITLEAKS := $(shell command -v gitleaks 2>/dev/null)
ifeq ($(GITLEAKS),)
GITLEAKS := $(HOME)/workspace/tools/bin/gitleaks
endif

.PHONY: help setup serve test check clean

help: ## Tampilkan daftar perintah
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS=":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

setup: ## Instalasi awal: aktifkan hook keamanan, cek dependensi
	git config core.hooksPath githooks
	@command -v node >/dev/null 2>&1 || (echo "node tidak ditemukan (butuh Node 18+)" && exit 1)
	@if [ -x "$(GITLEAKS)" ]; then echo "gitleaks: $(GITLEAKS)"; else echo "peringatan: gitleaks tidak ditemukan"; fi
	@echo "setup selesai"

serve: ## Jalankan game di http://localhost:8000
	python3 -m http.server 8000

test: ## Jalankan seluruh unit test
	node --test "tests/**/*.test.js"

check: test ## Test + pindai secret (gitleaks)
	@if [ -x "$(GITLEAKS)" ]; then \
		"$(GITLEAKS)" detect --verbose --redact --config .gitleaks.toml; \
	else \
		echo "gitleaks tidak ditemukan, pemindaian dilewati"; \
	fi

clean: ## Bersihkan file sementara
	rm -f *.log
