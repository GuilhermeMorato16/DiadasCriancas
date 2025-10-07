package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/jlaffaye/ftp"
)

// Config struct to hold our application configuration
type Config struct {
	FtpHost       string
	FtpUser       string
	FtpPassword   string
	FtpUploadPath string // Ex: "public_html/imagens"
	PublicURLBase string // Ex: "http://seu-dominio.com/imagens"
	ServerPort    string
}

// Response struct for JSON responses
type JSONResponse struct {
	Success  bool   `json:"success"`
	Message  string `json:"message,omitempty"`
	ImageURL string `json:"imageUrl,omitempty"`
}

func main() {
	// Carrega as configurações das variáveis de ambiente para segurança
	config := LoadConfig()

	// Define o handler para a rota de upload
	http.HandleFunc("/api/upload-ftp", uploadHandler(config))

	log.Printf("Servidor Go iniciado na porta %s", config.ServerPort)
	log.Println("Aguardando requisições em http://localhost" + config.ServerPort + "/api/upload-ftp")

	// Inicia o servidor HTTP
	err := http.ListenAndServe(config.ServerPort, nil)
	if err != nil {
		log.Fatalf("Erro ao iniciar o servidor: %v", err)
	}
}

// uploadHandler é o nosso controller que lida com a requisição de upload
func uploadHandler(config Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// --- CORS Headers ---
		// Permite que seu app React (em outra porta/domínio) acesse esta API
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// O navegador envia uma requisição OPTIONS primeiro para checar o CORS
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		if r.Method != "POST" {
			http.Error(w, "Método não permitido", http.StatusMethodNotAllowed)
			return
		}

		// 1. Parse do formulário multipart (tamanho máximo de 10 MB)
		err := r.ParseMultipartForm(10 << 20)
		if err != nil {
			sendJSONError(w, "Erro ao processar o arquivo: "+err.Error(), http.StatusBadRequest)
			return
		}

		// 2. Obter o arquivo do formulário pelo nome do campo ("image")
		file, handler, err := r.FormFile("image")
		if err != nil {
			sendJSONError(w, "Campo 'image' não encontrado no formulário.", http.StatusBadRequest)
			return
		}
		defer file.Close()

		// 3. Gerar um nome de arquivo único para evitar sobreposições
		uniqueFilename := fmt.Sprintf("%d-%s", time.Now().Unix(), filepath.Base(handler.Filename))

		// 4. Conectar e fazer upload para o FTP
		err = uploadToFTP(config, uniqueFilename, file)
		if err != nil {
			log.Printf("Erro no upload para o FTP: %v", err)
			sendJSONError(w, "Erro interno ao salvar a imagem.", http.StatusInternalServerError)
			return
		}

		// 5. Construir a URL pública final
		finalImageURL := config.PublicURLBase + "/" + uniqueFilename

		log.Printf("Upload bem-sucedido: %s", finalImageURL)

		// 6. Enviar a resposta de sucesso para o frontend
		sendJSONSuccess(w, "Upload realizado com sucesso!", finalImageURL)
	}
}

// uploadToFTP conecta ao servidor FTP e envia o arquivo
func uploadToFTP(config Config, filename string, file io.Reader) error {
	c, err := ftp.Dial(config.FtpHost, ftp.DialWithTimeout(5*time.Second))
	if err != nil {
		return err
	}
	defer c.Quit()

	err = c.Login(config.FtpUser, config.FtpPassword)
	if err != nil {
		return err
	}

	// O caminho completo no servidor FTP
	remotePath := filepath.Join(config.FtpUploadPath, filename)

	err = c.Stor(remotePath, file)
	if err != nil {
		return err
	}

	return nil
}

// LoadConfig carrega as configurações das variáveis de ambiente
func LoadConfig() Config {
	return Config{
		FtpHost:       getEnv("FTP_HOST", "ftp.seu-servidor.com:21"),
		FtpUser:       getEnv("FTP_USER", ""),
		FtpPassword:   getEnv("FTP_PASSWORD", ""),
		FtpUploadPath: getEnv("FTP_UPLOAD_PATH", "public_html/imagens"),
		PublicURLBase: getEnv("PUBLIC_URL_BASE", "http://seu-dominio.com/imagens"),
		ServerPort:    getEnv("SERVER_PORT", ":8080"),
	}
}

// getEnv é uma função auxiliar para ler variáveis de ambiente com um valor padrão
func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

// Funções auxiliares para enviar respostas JSON
func sendJSONError(w http.ResponseWriter, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(JSONResponse{Success: false, Message: message})
}

func sendJSONSuccess(w http.ResponseWriter, message, imageUrl string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(JSONResponse{Success: true, Message: message, ImageURL: imageUrl})
}
