Vagrant.configure("2") do |config|
  config.ssh.insert_key = false

  config.vm.define "target" do |target|
    target.vm.box = "ubuntu/jammy64"
    target.vm.hostname = "target"
    target.vm.network "private_network", ip: "192.168.56.20"
    target.vm.network "forwarded_port", guest: 80, host: 8080
    target.vm.synced_folder ".", "/vagrant"
    target.vm.provision "shell", path: "scripts/provision-docker-target.sh"
    target.vm.provider "virtualbox" do |vb|
      vb.name = "mywebapp-target"
      vb.memory = "1024"
      vb.cpus = 1
    end
  end

  config.vm.define "runner" do |runner|
    runner.vm.box = "ubuntu/jammy64"
    runner.vm.hostname = "runner"
    runner.vm.network "private_network", ip: "192.168.56.21"
    runner.vm.synced_folder ".", "/vagrant"
    runner.vm.provision "shell", path: "scripts/setup-github-runner.sh"
    runner.vm.provider "virtualbox" do |vb|
      vb.name = "mywebapp-runner"
      vb.memory = "1024"
      vb.cpus = 1
    end
  end
end