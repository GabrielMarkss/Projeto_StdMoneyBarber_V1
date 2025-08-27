package com.stmoneybarber.backend.controller;

import java.io.File;
import java.io.IOException;
import java.util.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.stmoneybarber.backend.model.Usuario;
import com.stmoneybarber.backend.repository.UsuarioRepository;
import com.stmoneybarber.backend.service.JwtService;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = { "http://localhost:4200", "http://192.168.100.183:4200",
        "http://192.168.1.46:4200" }, allowCredentials = "true", methods = { RequestMethod.GET, RequestMethod.POST,
                RequestMethod.PUT })
public class UsuarioController {

    private static final Logger logger = LoggerFactory.getLogger(UsuarioController.class);

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtService jwtService;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody Usuario usuario) {
        logger.info("Tentativa de registro para email: {}", usuario.getEmail());
        if (usuarioRepository.findByEmail(usuario.getEmail()).isPresent()) {
            logger.warn("Email já está em uso: {}", usuario.getEmail());
            return ResponseEntity.badRequest().body("Email já está em uso");
        }

        String telefone = usuario.getTelefone();
        if (telefone != null && !telefone.trim().isEmpty()) {
            if (usuarioRepository.findByTelefone(telefone).isPresent()) {
                logger.warn("Telefone já está em uso: {}", telefone);
                return ResponseEntity.badRequest().body("Telefone já está em uso");
            }
        } else {
            usuario.setTelefone(null);
        }

        usuarioRepository.save(usuario);
        logger.info("Usuário registrado com sucesso: {}", usuario.getEmail());
        return ResponseEntity.ok("Usuário cadastrado com sucesso");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginData) {
        logger.info("Tentativa de login com identificador: {}", loginData.get("identificador"));
        try {
            String identificador = loginData.get("identificador");
            String senha = loginData.get("senha");

            if (identificador == null || senha == null) {
                logger.warn("Identificador ou senha ausentes");
                return ResponseEntity.badRequest().body("Identificador e senha são obrigatórios");
            }

            Optional<Usuario> usuarioOpt = Optional.empty();

            if (identificador.contains("@")) {
                usuarioOpt = usuarioRepository.findByEmail(identificador);
            }

            if (usuarioOpt.isEmpty()) {
                usuarioOpt = usuarioRepository.findByTelefone(identificador);
            }

            if (usuarioOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                if (usuario.getSenha().equals(senha)) { // Em produção, use hash
                    String token = jwtService.generateToken(usuario.getEmail());
                    logger.info("Login bem-sucedido para: {}", usuario.getEmail());
                    return ResponseEntity.ok(Collections.singletonMap("token", token));
                } else {
                    logger.warn("Senha incorreta para: {}", identificador);
                    return ResponseEntity.status(401).body("Senha incorreta");
                }
            }

            logger.warn("Usuário não encontrado: {}", identificador);
            return ResponseEntity.status(404).body("Usuário não encontrado");

        } catch (Exception e) {
            logger.error("Erro interno no login: {}", e.getMessage());
            return ResponseEntity.status(500).body("Erro interno no servidor: " + e.getMessage());
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getUsuarioLogado(@RequestHeader("Authorization") String authHeader) {
        logger.info("Requisição para /me com Authorization: {}", authHeader);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("Token ausente ou inválido");
            return ResponseEntity.status(401).body(Collections.singletonMap("erro", "Token ausente ou inválido"));
        }

        String token = authHeader.substring(7);

        if (!jwtService.isTokenValid(token)) {
            logger.warn("Token inválido");
            return ResponseEntity.status(401).body(Collections.singletonMap("erro", "Token inválido"));
        }

        String email = jwtService.extractEmail(token);
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();
            Map<String, Object> userData = new HashMap<>();
            userData.put("id", usuario.getId());
            userData.put("nome", usuario.getNome());
            userData.put("sobrenome", usuario.getSobrenome());
            userData.put("email", usuario.getEmail());
            userData.put("telefone", usuario.getTelefone());
            userData.put("admin", usuario.isAdmin());
            userData.put("imagemUrl", usuario.getImagemUrl());
            logger.info("Dados do usuário retornados para: {}", email);
            return ResponseEntity.ok(userData);
        } else {
            logger.warn("Usuário não encontrado: {}", email);
            return ResponseEntity.status(404).body(Collections.singletonMap("erro", "Usuário não encontrado"));
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> atualizarUsuario(@RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> dados) {
        logger.info("Requisição para atualizar usuário com dados: {}", dados);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("Token ausente ou inválido");
            return ResponseEntity.status(401).body(Collections.singletonMap("erro", "Token ausente ou inválido"));
        }

        String token = authHeader.substring(7);
        if (!jwtService.isTokenValid(token)) {
            logger.warn("Token inválido");
            return ResponseEntity.status(401).body(Collections.singletonMap("erro", "Token inválido"));
        }

        String emailAtual = jwtService.extractEmail(token);
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(emailAtual);

        if (usuarioOpt.isEmpty()) {
            logger.warn("Usuário não encontrado: {}", emailAtual);
            return ResponseEntity.status(404).body(Collections.singletonMap("erro", "Usuário não encontrado"));
        }

        Usuario usuario = usuarioOpt.get();

        if (dados.containsKey("nome") && dados.get("nome") != null && !dados.get("nome").trim().isEmpty()) {
            usuario.setNome(dados.get("nome"));
        }
        if (dados.containsKey("sobrenome")) {
            usuario.setSobrenome(dados.get("sobrenome"));
        }
        if (dados.containsKey("senha") && dados.get("senha") != null && !dados.get("senha").trim().isEmpty()) {
            usuario.setSenha(dados.get("senha")); // Em produção, use hash
        }
        if (dados.containsKey("email") && dados.get("email") != null && !dados.get("email").trim().isEmpty()) {
            String novoEmail = dados.get("email");
            if (!novoEmail.equals(usuario.getEmail()) && usuarioRepository.findByEmail(novoEmail).isPresent()) {
                logger.warn("Email já está em uso: {}", novoEmail);
                return ResponseEntity.badRequest().body(Collections.singletonMap("erro", "Email já está em uso"));
            }
            usuario.setEmail(novoEmail);
        }
        if (dados.containsKey("telefone")) {
            String novoTelefone = dados.get("telefone");
            if (novoTelefone != null && !novoTelefone.trim().isEmpty()) {
                if (!novoTelefone.equals(usuario.getTelefone())
                        && usuarioRepository.findByTelefone(novoTelefone).isPresent()) {
                    logger.warn("Telefone já está em uso: {}", novoTelefone);
                    return ResponseEntity.badRequest()
                            .body(Collections.singletonMap("erro", "Telefone já está em uso"));
                }
                usuario.setTelefone(novoTelefone);
            } else {
                usuario.setTelefone(null);
            }
        }

        usuarioRepository.save(usuario);
        logger.info("Usuário atualizado com sucesso: {}", usuario.getEmail());
        // Retorna um JSON em vez de texto puro
        return ResponseEntity.ok(Collections.singletonMap("message", "Dados atualizados com sucesso"));
    }

    @PostMapping(value = "/me/imagem", consumes = "multipart/form-data")
    public ResponseEntity<?> uploadImagem(@RequestHeader("Authorization") String authHeader,
            @RequestParam("file") MultipartFile file) {
        logger.info("Requisição para upload de imagem");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("Token ausente ou inválido");
            return ResponseEntity.status(401).body(Collections.singletonMap("erro", "Token ausente ou inválido"));
        }

        String token = authHeader.substring(7);
        if (!jwtService.isTokenValid(token)) {
            logger.warn("Token inválido");
            return ResponseEntity.status(401).body(Collections.singletonMap("erro", "Token inválido"));
        }

        String email = jwtService.extractEmail(token);
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            logger.warn("Usuário não encontrado: {}", email);
            return ResponseEntity.status(404).body(Collections.singletonMap("erro", "Usuário não encontrado"));
        }

        Usuario usuario = usuarioOpt.get();

        if (file.isEmpty()) {
            logger.warn("Arquivo vazio recebido");
            return ResponseEntity.badRequest().body("Arquivo vazio");
        }

        try {
            // Use um caminho absoluto para o diretório de upload
            String uploadDir = "C:/stmoneybarber/uploads/"; // Ajuste para o caminho desejado
            File uploadDirFile = new File(uploadDir);
            if (!uploadDirFile.exists()) {
                logger.info("Criando diretório de upload: {}", uploadDir);
                boolean created = uploadDirFile.mkdirs();
                if (!created) {
                    logger.error("Falha ao criar diretório de upload: {}", uploadDir);
                    return ResponseEntity.status(500).body("Erro ao criar diretório de upload");
                }
            }

            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            String filePath = uploadDir + fileName;
            File destFile = new File(filePath);
            file.transferTo(destFile);

            usuario.setImagemUrl("/uploads/" + fileName);
            usuarioRepository.save(usuario);
            logger.info("Imagem salva com sucesso para: {}, URL: {}", email, usuario.getImagemUrl());

            return ResponseEntity.ok(Collections.singletonMap("imagemUrl", usuario.getImagemUrl()));
        } catch (IOException e) {
            logger.error("Erro ao salvar imagem: {}", e.getMessage());
            return ResponseEntity.status(500).body("Erro ao salvar imagem: " + e.getMessage());
        }
    }
}