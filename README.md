# Stamp Image Parsing Application

## Download Application

The application that is installable by end users is available for download from [www.drakeserver.com](http://www.drakeserver.com)

## Usage Instructions

A manual for installation and usage of the application is written in Google Docs and is available for viewing [here](https://docs.google.com/document/d/1NYskeZt9FIKIE1SduEA6yZRSdh3IpvNzU-tWamDJsBk/edit?usp=sharing)

## Progress Videos

This video was made when the application was Electron-JS based.  Currently due to continued complexities interfacing with the
Java processing logic, the application has moved to a micro-service architecture with a Web application front-end. 

Here is a short video showing the application in action (Note the window frame and dialogs are not visible due to the recording software):
[BETA Video](http://www.drakeserver.com/javaws/videos/BETA%20-%20Stamp%20Image%20Bursting%20Application.mp4)

## Pre-Requisites (Build Tooling)

Due to the complex environment, the pre-requisites to build are extensive.  

- Java 1.8 or higher using the 64-bit JVM
- NodeJS 16.x or higher
- Aurelia CLI (install with "npm install -g aurelia-cli")
- Maven 3.x+ (optional if using Maven Supported IDE)
- Spring Tool Suite (Optional if you want an IDE for Java Development)

## Client JavaScript Setup

To clone and run this repository you'll need [Git](https://git-scm.com) and [Node.js](https://nodejs.org/en/download/) (which comes with [npm](http://npmjs.com)) installed on your computer. From your command line:

Ensure you have followed the pre-requisites

```bash
# Clone this repository
git clone https://github.com/jadrake75/stamp-imageparsing.git
# Go into the repository
cd stamp-imageparsing/web-app
# Install dependencies
npm install
```


## Build Aurelia app (client JavaScript application)

```bash
au build
# Will stage Aurelia app for use in microservice
au stage
```

### Building the Server Microservice

* In Spring Tool Suite import the project
* Refresh "src/resources/web-app" as this contains the staged application
* Right click on the Project -> Run as -> Maven install
* This should build everything correctly

### Microservice Execution

* By default the microservice will run on port 9000.  This can be changed by adding a "application.properties" in the 
same directory as the executable JAR file and defining the property "server.port=9000"
* Access the application with a web-browser as "localhost:9000"

### Dynamically Building and Running the Client Application

* The web client application comes with a reverse proxy.  If you execute the command "au run --watch" from the web-app folder
it will automatically proxy requests to /api to port 9000.  If this port was changed above, you can change the proxy port by editing
the file "web-app/aurelia-project/tasks/proxy-settings.json"


## Executing Unit Tests

To execute the tests run the following
```bash
au test
```

You can add the ``--watch`` flag if you want to keep the tests harness running and watch for code changes.  This currently only tests the client application code.





## Concept Art

The following is a sketch created for the concept art for the project

![Concept Sketch](https://github.com/jadrake75/stamp-imageparsing/raw/master/web-app/assets/sketches/image-bursting-sketch.png)


## License

[Apache 2.0](LICENSE)
