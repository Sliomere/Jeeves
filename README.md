# Jeeves

#### Serving your sites. Easily.

![Jeeves](https://github.com/Sliomere/Jeeves/raw/master/jeeves.png)

## About Jeeves

Jeeves is a small script that you can use to refer to your website by a local .test domain. For example, let's say you run jeeves on a site named "MyWebApp", jeeves will then add "127.0.0.1 mywebapp.test" to the hosts file and create a VirtualHost for apache to serve the site.

## Install

`npm install sliomere/jeeves`

## Prerequisites

In order to use Jeeves, a few steps need to have been completed.

1. PHP must be installed and properly configured
2. Apache must be installed and properly configured

## Usage

Create a link: `jeeves link <domain>`

Remove a link: `jeeves unlink <domain>`

## Config

The config file contains the following options:

| Config Key | Description                                                                             | Default value                                |
| ---------- | --------------------------------------------------------------------------------------- | -------------------------------------------- |
| vhostsFile | The location of the apache httpd-vhosts.conf file                                       | `C:\\Apache\\conf\\extra\\httpd-vhosts.conf` |
| laravel    | Enable or disable laravel support (ensures that the link points to a /public directory) | `true`                                       |
