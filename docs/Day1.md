# Day 1 — Project Initialization

This document explains everything completed on Day 1, in simple terms, so you understand the foundations of your project.

## 1\. Created a GitHub Repository

A GitHub repository is your project's online storage. It keeps your code versioned and accessible.

You created a repository named:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML` api-rate-limiter-as-a-service `

This repository will store all source code, documentation, CI/CD pipelines, and future enhancements.

## 2\. Cloned the Repository into VS Code

You cloned the repository to your local machine using:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`git clone`

This gives you a local working environment where you can write, run, and test your code.

## 3\. Initialized a Go Module

You set up Go to recognize your project as a module:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML` go mod init github.com//api-rate-limiter-as-a-service `

This creates a go.mod file that defines:

- the project name
- future dependencies
- versioning information

Every Go project needs this file before writing code.

## 4\. Created a Professional Project Folder Structure

You created a clean backend layout commonly used in production services:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML` cmd/server/          → main application entrypoint  internal/handlers/   → HTTP route handlers  internal/ratelimiter/→ rate limiting algorithms  internal/config/     → configuration and environment loading  internal/storage/    → Redis and PostgreSQL integration  pkg/utils/           → shared utility functions `

This structure helps organize your code, keeping it modular and scalable as the project grows.

## 5\. Added a Basic HTTP Server

You wrote your first Go web server with a simple health endpoint:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML` http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {      w.Write([]byte("OK"))  }) `

Visiting:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML` http://localhost:8080/health `

returns:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML` OK `

This confirms your server runs correctly.

## 6\. Created a Dockerfile

A Dockerfile describes how to build a container image of your application. Containers allow your application to run the same way on any machine.

You created the following Dockerfile:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML` FROM golang:1.22-alpine AS builder  WORKDIR /app  COPY . .  RUN go build -o server ./cmd/server  FROM alpine  WORKDIR /app  COPY --from=builder /app/server .  EXPOSE 8080  CMD ["./server"] `

This prepares your project for containerization, which is required for Kubernetes and cloud deployment.

## 7\. Ran the Server Locally

You tested the server using:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML` go run cmd/server/main.go `

Go compiled and executed the program, and the health endpoint confirmed that the application works.

## 8\. Built and Ran the Docker Container

You created and executed the Docker container:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML` docker build -t rate-limiter .  docker run -p 8080:8080 rate-limiter `

This step proves your application runs properly inside a container, making it portable and cloud-ready.

## 9\. Created a Feature Branch and Committed the Code

Branch name:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML` feature/project-initialization `

Commit message:

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML` feat: initialize project with basic server setup and Dockerfile `

Using feature branches and clear commit messages is an industry-standard workflow followed by software engineers in real companies.

# Summary of What You Accomplished

You successfully:

- created and cloned a GitHub repository
- initialized a Go project
- set up a professional folder structure
- built a basic HTTP server
- created a Dockerfile
- tested the server and container
- committed all work using a feature branch

These steps form the foundation of a real backend service and match industry practices.
