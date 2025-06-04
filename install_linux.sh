#!/bin/bash

echo "INICIANDO INSTALACAO";
echo "Checando se o node está instalado..."

if command -v node &> /dev/null; then
	versao_node=$(node -v)
	versao_npm=$(npm -v)
	echo "Node.js está instalado"
	echo "----------------------------------"
	echo "Checando a versão do node"
	echo "Versão $versao_node"
	echo "----------------------------------"
	echo "Checando versão do NPM"
	echo "Versão $versao_npm"
	echo "-----------------------------------"
	echo "Instalando Depedencias"
	npm install
	echo "----------------------------------"
	echo "Depedencias instaladas"	
else
	while read -p "Node.js não instalado, deseja instalar?(S/N)" entrada
	do
		if ["$entrada"] = "S"; then
			echo "Instalando Node.js..."
			break
		elif ["$entrada"] = "N"; then
			echo "Não foi possível instalar o projeto pois Node.js não está instalado"
			break
		fi		
	done
fi


