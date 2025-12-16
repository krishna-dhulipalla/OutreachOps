import argparse
import subprocess
import sys
import signal
import time
import os

def run_backend():
    print("🚀 Starting Backend...")
    # Using shell=True for Windows compatibility with venv/path variables usually
    return subprocess.Popen(["uvicorn", "main:app", "--reload"], cwd="backend", shell=True)

def run_frontend():
    print("🚀 Starting Frontend...")
    return subprocess.Popen(["npm", "run", "dev"], cwd="frontend", shell=True)

def main():
    parser = argparse.ArgumentParser(description="Run OutreachOps Application")
    parser.add_argument("--all", action="store_true", help="Run both backend and frontend")
    parser.add_argument("--backend", action="store_true", help="Run backend only")
    parser.add_argument("--frontend", action="store_true", help="Run frontend only")
    
    args = parser.parse_args()
    
    # Default to all if no specific flag, or force user to choose? 
    # User asked for flags, but usually running without args implies all or help. 
    # I'll default to help if empty to be safe, as per my thought process.
    if not (args.all or args.backend or args.frontend):
        parser.print_help()
        sys.exit(1)

    processes = []

    try:
        if args.all or args.backend:
            processes.append(run_backend())
        
        if args.all or args.frontend:
            # Short sleep to let backend start initializing (optional but nice)
            if args.all:
                time.sleep(1) 
            processes.append(run_frontend())
            
        print("\n✨ OutreachOps is running! Press Ctrl+C to stop.\n")
        
        # logical loop to keep script running
        while True:
            time.sleep(1)
            # Check if processes are still alive
            for p in processes:
                if p.poll() is not None:
                    print(f"Process {p.args} exited unexpectedly.")
                    sys.exit(1)
                    
    except KeyboardInterrupt:
        print("\n🛑 Shutting down services...")
        for p in processes:
            if os.name == 'nt':
                # On Windows, terminate might not propagate to shell children effectively without taskkill
                subprocess.call(['taskkill', '/F', '/T', '/PID', str(p.pid)])
            else:
                p.terminate()
        sys.exit(0)

if __name__ == "__main__":
    main()
